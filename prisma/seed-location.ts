import { prisma } from '../src/config/database'
import fs from 'fs'
import path from 'path'

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')

async function seed() {

  console.log('🌱 Seeding Languages...')

  const languagesPath = path.join(process.cwd(), 'data/indian-languages.json')
  const languages: { code?: string; name: string }[] = JSON.parse(
    fs.readFileSync(languagesPath, 'utf-8')
  )

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { name: lang.name },
      update: {},
      create: {
        name: lang.name,
        code: lang.code ?? null
      }
    })
  }

  console.log(`✅ Languages inserted: ${languages.length}`)


  console.log('🌱 Seeding States...')

  const citiesPath = path.join(process.cwd(), 'data/indian-cities-by-state.json')
  const citiesByState: Record<string, string[]> = JSON.parse(
    fs.readFileSync(citiesPath, 'utf-8')
  )

  const states = Object.keys(citiesByState)

  for (const state of states) {
    await prisma.state.upsert({
      where: { name: state },
      update: {},
      create: {
        name: state,
        slug: slugify(state)
      }
    })
  }

  console.log(`✅ States inserted: ${states.length}`)


  console.log('🌱 Seeding Cities...')

  const citySet = new Set<string>()

  for (const cityList of Object.values(citiesByState)) {
    for (const city of cityList) {
      citySet.add(city)
    }
  }

  const cities = Array.from(citySet)

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city },
      update: {},
      create: {
        name: city,
        slug: slugify(city)
      }
    })
  }

  console.log(`✅ Cities inserted: ${cities.length}`)

  console.log('🎉 Location seeding completed!')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })