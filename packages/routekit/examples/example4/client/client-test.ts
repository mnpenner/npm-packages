#!/usr/bin/env -S bun
import { apiClient } from './api-client.ts'

const result = await apiClient.usersById.get({ path: { id: 123 } })

console.log(result)
