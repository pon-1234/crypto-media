'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ProfileSettingsFormProps {
  initialName: string
  email: string
}

const profileSchema = z.object({
  name: z.string().min(1, { message: '名前は必須です' }),
})

type ProfileFormValues = z.infer<typeof profileSchema>

/**
 * プロフィール設定フォーム
 * @doc https://github.com/pon-1234/crypto-media/issues/38
 * @issue #38 - マイページ機能の拡張
 */
export function ProfileSettingsForm({
  initialName,
  email,
}: ProfileSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialName,
    },
  })

  const onSubmit: SubmitHandler<ProfileFormValues> = (data) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: data.name }),
        })

        if (!response.ok) {
          throw new Error('プロフィールの更新に失敗しました')
        }

        toast.success('プロフィールを更新しました')
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : '予期せぬエラーが発生しました'
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          名前
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={email}
          disabled
          className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
        />
        <p className="text-xs text-gray-500">
          メールアドレスは変更できません
        </p>
      </div>

      <div>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? '更新中...' : 'プロフィールを更新'}
        </Button>
      </div>
    </form>
  )
}