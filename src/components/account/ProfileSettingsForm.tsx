'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/account'

const profileSchema = z.object({
  name: z.string().min(1, '表示名を入力してください').max(50, '表示名は50文字以内で入力してください'),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileSettingsFormProps {
  currentName: string
  userId: string
}

export function ProfileSettingsForm({ currentName, userId }: ProfileSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentName,
    },
  })

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      try {
        const result = await updateProfile(userId, data)
        
        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('プロフィールを更新しました')
      } catch (error) {
        console.error('Profile update error:', error)
        toast.error('プロフィールの更新に失敗しました')
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">表示名</Label>
        <Input
          id="name"
          {...register('name')}
          className="mt-1"
          disabled={isPending}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>
      
      <Button type="submit" disabled={isPending}>
        {isPending ? '更新中...' : '更新する'}
      </Button>
    </form>
  )
}