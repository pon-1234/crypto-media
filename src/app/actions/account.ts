'use server'

import { adminDb } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import bcrypt from 'bcryptjs'
import Stripe from 'stripe'

/**
 * プロフィール更新アクション
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related ProfileSettingsForm - フォームコンポーネント
 * @issue #38 - マイページ機能の拡張
 */
export async function updateProfile(userId: string, data: { name: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.id !== userId) {
      return { error: '認証エラー' }
    }

    await adminDb.collection('users').doc(userId).update({
      name: data.name,
      updatedAt: new Date(),
    })

    revalidatePath('/media/mypage')
    revalidatePath('/media/mypage/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Profile update error:', error)
    return { error: 'プロフィールの更新に失敗しました' }
  }
}

/**
 * パスワード変更アクション
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related PasswordChangeForm - フォームコンポーネント
 * @issue #38 - マイページ機能の拡張
 */
export async function changePassword(
  userId: string, 
  data: { currentPassword: string; newPassword: string; confirmPassword: string }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.id !== userId) {
      return { error: '認証エラー' }
    }

    // パスワードバリデーション
    if (data.newPassword.length < 8) {
      return { error: 'パスワードは8文字以上で入力してください' }
    }
    if (!/[A-Za-z]/.test(data.newPassword) || !/[0-9]/.test(data.newPassword)) {
      return { error: 'パスワードは英数字を含む必要があります' }
    }
    if (data.newPassword !== data.confirmPassword) {
      return { error: 'パスワードが一致しません' }
    }

    // ユーザー情報を取得
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    
    if (!userData?.passwordHash) {
      return { error: 'パスワード認証に対応していないアカウントです' }
    }

    // 現在のパスワードを確認
    const isValidPassword = await bcrypt.compare(data.currentPassword, userData.passwordHash)
    if (!isValidPassword) {
      return { error: '現在のパスワードが正しくありません' }
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)

    // パスワードを更新
    await adminDb.collection('users').doc(userId).update({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    
    return { success: true }
  } catch (error) {
    console.error('Password change error:', error)
    return { error: 'パスワードの変更に失敗しました' }
  }
}

/**
 * アカウント削除アクション
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @related DeleteAccountForm - フォームコンポーネント
 * @issue #38 - マイページ機能の拡張
 */
export async function deleteAccount(
  userId: string,
  data: { password: string; reason?: string; hasPaidMembership: boolean }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.id !== userId) {
      return { error: '認証エラー' }
    }

    // ユーザー情報を取得
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    
    if (!userData) {
      return { error: 'ユーザー情報が見つかりません' }
    }

    // パスワード認証を行う（Googleログインユーザーはパスワードがない場合がある）
    if (userData.passwordHash) {
      const isValidPassword = await bcrypt.compare(data.password, userData.passwordHash)
      if (!isValidPassword) {
        return { error: 'パスワードが正しくありません' }
      }
    } else {
      // Googleログインユーザーの場合は、セキュリティのため追加確認が必要
      // 現在はセッション確認のみで許可しているが、将来的にはメール確認等を実装予定
      console.warn(`Password-less account deletion attempted for user: ${userId}`)
    }

    // 有料会員の場合はStripeサブスクリプションをキャンセル
    if (data.hasPaidMembership && userData.stripeSubscriptionId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-02-24.acacia',
      })

      try {
        await stripe.subscriptions.cancel(userData.stripeSubscriptionId)
      } catch (stripeError) {
        console.error('Stripe subscription cancellation error:', stripeError)
        // Stripeエラーでも削除処理は続行
      }
    }

    // 退会理由を記録（任意）
    if (data.reason) {
      await adminDb.collection('deletion_reasons').add({
        userId,
        reason: data.reason,
        deletedAt: new Date(),
        hadPaidMembership: data.hasPaidMembership,
      })
    }

    // Firestoreからユーザーデータを削除
    await adminDb.collection('users').doc(userId).delete()
    await adminDb.collection('members').doc(userId).delete()

    // Firebase Authenticationからユーザーを削除
    try {
      const auth = getAuth()
      await auth.deleteUser(userId)
    } catch (authError) {
      console.error('Firebase Auth deletion error:', authError)
      // 認証エラーでも削除処理は完了とする
    }

    return { success: true }
  } catch (error) {
    console.error('Account deletion error:', error)
    return { error: 'アカウントの削除に失敗しました' }
  }
}