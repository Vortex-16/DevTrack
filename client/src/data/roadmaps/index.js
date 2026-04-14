import { frontendRoadmap } from './frontend'
import { backendRoadmap } from './backend'
import { fullstackRoadmap } from './fullstack'
import { devopsRoadmap } from './devops'

// Compute topic counts
const withCounts = (roadmap) => {
  const totalTopics = roadmap.sections.reduce((acc, s) => acc + s.topics.length, 0)
  return { ...roadmap, totalTopics }
}

export const allRoadmaps = [
  withCounts(frontendRoadmap),
  withCounts(backendRoadmap),
  withCounts(fullstackRoadmap),
  withCounts(devopsRoadmap),
]

export const getRoadmapById = (id) => allRoadmaps.find(r => r.id === id)
