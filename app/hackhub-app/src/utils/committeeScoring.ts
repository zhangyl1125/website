import type { JudgeScore, ScoreSummary } from '../services/judgingService'
import type { VotingCriteria } from '../services/votingService'
import { IdeaService } from '../services/ideaService'

export function officialCriteria(criteria: VotingCriteria[]): boolean {
  return criteria.length === 2
    && criteria.some((item) => /behaviou?r/i.test(item.name) && item.weight === 70)
    && criteria.some((item) => /business|impact/i.test(item.name) && item.weight === 30)
}

export async function loadAllNominations(hackathonId: string) {
  const first = await IdeaService.getIdeas(hackathonId, 0, 100)
  const remaining = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
    IdeaService.getIdeas(hackathonId, index + 1, 100)))
  return [...first.content, ...remaining.flatMap((page) => page.content)]
}

export function rankCommitteeScores(scores: ScoreSummary[]) {
  const sorted = scores.map((score) => ({ ...score, panelScore: score.judgeCount === 0 ? null : score.panelScore })).sort((a, b) => (b.panelScore ?? -1) - (a.panelScore ?? -1) || a.ideaTitle.localeCompare(b.ideaTitle))
  let rank = 0
  return sorted.map((score, index) => {
    if (index === 0 || score.panelScore !== sorted[index - 1].panelScore) rank = index + 1
    return { ...score, displayRank: score.panelScore === null ? null : rank }
  })
}

export function savedEvaluation(scores: JudgeScore[]) {
  const note = scores.find((score) => score.comment)?.comment ?? ''
  const recommendation = /^Recommendation: ([^\n]+)/.exec(note)?.[1] ?? null
  return {
    scores: Object.fromEntries(scores.filter((score) => score.criterionId).map((score) => [score.criterionId!, score.score])),
    recommendation,
    comment: note.replace(/^Recommendation: [^\n]+\n*/, ''),
  }
}
