import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export function get(userId) {
  return axios.get(`${BASE_URL}/api/emoji-pets/${userId}`)
}

export function getAll(userId) {
  return axios.get(`${BASE_URL}/api/emoji-pets/${userId}/all`)
}

export function unlock(userId, emojiPetId) {
  return axios.post(`${BASE_URL}/api/emoji-pets/unlock/${userId}/${emojiPetId}`)
}
