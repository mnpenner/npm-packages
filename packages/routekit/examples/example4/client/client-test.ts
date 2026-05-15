#!/usr/bin/env -S bun
import { apiClient } from './api-client.ts'

const result = await apiClient.usersById.get({path:{id:'123'}})  // FIXME: `id` should require string because get() is going to `encodeURIComponent` it into a string and it'll be set as a string over the wire regardless -- i.e., the server will receive a string.

console.log(result)
