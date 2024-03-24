const availableCategories = [
  'age',
  'alone',
  'amazing',
  'anger',
  'architecture',
  'art',
  'attitude',
  'beauty',
  'best',
  'birthday',
  'business',
  'car',
  'change',
  'communication',
  'computers',
  'cool',
  'courage',
  'dad',
  'dating',
  'death',
  'design',
  'dreams',
  'education',
  'environmental',
  'equality',
  'experience',
  'failure',
  'faith',
  'family',
  'famous',
  'fear',
  'fitness',
  'food',
  'forgiveness',
  'freedom',
  'friendship',
  'funny',
  'future',
  'god',
  'good',
  'government',
  'graduation',
  'great',
  'happiness',
  'health',
  'history',
  'home',
  'hope',
  'humor',
  'imagination',
  'inspirational',
  'intelligence',
  'jealousy',
  'knowledge',
  'leadership',
  'learning',
  'legal',
  'life',
  'love',
  'marriage',
  'medical',
  'men',
  'mom',
  'money',
  'morning',
  'movies',
  'success',
] as const

// TODO this api has some daily limits and with lot of requests it can get pricey. Consider caching responses
export async function getSentence() {
  const apiKey = process.env.QUOTES_API_KEY
  if (apiKey?.length) {
    const randomCategoryIndex = Math.floor(Math.random() * ((availableCategories.length - 1) + 1))
    const randomCategory = availableCategories[randomCategoryIndex]
    const response = await fetch('https://api.api-ninjas.com/v1/quotes?category=' + randomCategory, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      }
    })

    return response.json()
  }

  // TODO consider global env's validation on setup
  // TODO work on error messages - should be useful for devs and not leak info to users
  throw new Error('Something went wrong')
}
