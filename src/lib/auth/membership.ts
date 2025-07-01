import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { adminDb } from '@/lib/firebase/admin';

/**
 * 会員情報の型定義
 */
export interface Membership {
  userId: string;
  email: string;
  membership: 'free' | 'paid';
  membershipUpdatedAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentStatus?: string;
}

/**
 * ユーザーの会員ステータスを取得するヘルパー関数
 * 
 * @doc この関数は、現在のセッションからユーザーIDを取得し、
 * Firestoreからユーザーの会員情報を取得します。
 * 
 * @returns ユーザーの会員情報。未認証の場合はnullを返します。
 * 
 * @related src/lib/auth/authOptions.ts - NextAuth設定
 * @related src/app/api/stripe/webhook/route.ts - 会員ステータス更新ロジック
 */
export async function getUserMembership(): Promise<Membership | null> {
  try {
    // 現在のセッションを取得
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      // 未認証ユーザー（ゲスト）
      return null;
    }

    // FirestoreからユーザーDocumentを取得
    const userDoc = await adminDb.collection('users').doc(session.user.id).get();
    
    if (!userDoc.exists) {
      // ユーザーDocumentが存在しない場合
      console.error(`User document not found for ID: ${session.user.id}`);
      return null;
    }

    const userData = userDoc.data();
    
    return {
      userId: session.user.id,
      email: userData?.email || session.user.email,
      membership: userData?.membership || 'free',
      membershipUpdatedAt: userData?.membershipUpdatedAt,
      stripeCustomerId: userData?.stripeCustomerId,
      stripeSubscriptionId: userData?.stripeSubscriptionId,
      paymentStatus: userData?.paymentStatus,
    };
  } catch (error) {
    console.error('Error fetching user membership:', error);
    return null;
  }
}

/**
 * ユーザーが有料会員かどうかを判定する関数
 * 
 * @doc この関数は、getUserMembershipを使用してユーザーの会員ステータスを確認し、
 * 有料会員かどうかを判定します。
 * 
 * @returns 有料会員の場合true、それ以外（無料会員・ゲスト）の場合false
 * 
 * @related getUserMembership - 会員情報取得関数
 */
export async function isPaidMember(): Promise<boolean> {
  const membership = await getUserMembership();
  return membership?.membership === 'paid';
}

/**
 * 会員ステータスに基づいたアクセス権限をチェックする関数
 * 
 * @doc この関数は、コンテンツの必要な会員レベルと
 * ユーザーの現在の会員ステータスを比較してアクセス可否を判定します。
 * 
 * @param requiredLevel - コンテンツに必要な会員レベル ('public' | 'paid')
 * @returns アクセス可能な場合true、不可の場合false
 * 
 * @related getUserMembership - 会員情報取得関数
 */
export async function hasAccess(requiredLevel: 'public' | 'paid'): Promise<boolean> {
  // publicコンテンツは誰でもアクセス可能
  if (requiredLevel === 'public') {
    return true;
  }

  // paidコンテンツは有料会員のみアクセス可能
  return await isPaidMember();
}

/**
 * 会員ステータスの型定義
 */
export type MembershipStatus = {
  userId: string;
  email: string | null;
  membership: 'free' | 'paid';
  membershipUpdatedAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentStatus?: 'active' | 'past_due' | 'canceled' | 'unpaid';
} | null;