import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { HackathonService } from '../services/hackathonService'
import { JudgingService } from '../services/judgingService'
import { getAllPages } from '../services/pagination'

/** Committee membership is campaign-specific; participant alone does not imply judge access. */
export function useAwardAccess() {
  const { user } = useAuthStore()
  const [assignment, setAssignment] = useState<{ userId: string; campaignIds: string[] } | null>(null)
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  useEffect(() => {
    if (!user || canManage) return
    let active = true
    void getAllPages((page) => HackathonService.getHackathons(page, 100))
      .then((campaigns) => Promise.all(campaigns.map(async (campaign) => {
        const judges = await JudgingService.getJudges(campaign.id)
        return judges.some((judge) => judge.userId === user.id) ? campaign.id : null
      })))
      .then((ids) => { if (active) setAssignment({ userId: user.id, campaignIds: ids.filter((id): id is string => id !== null) }) })
      .catch(() => { if (active) setAssignment({ userId: user.id, campaignIds: [] }) })
    return () => { active = false }
  }, [user, canManage])
  const campaignIds = assignment?.userId === user?.id ? assignment?.campaignIds ?? [] : []
  return { loading: Boolean(user && !canManage && assignment?.userId !== user.id), canManage, canReview: canManage || campaignIds.length > 0, campaignIds }
}
