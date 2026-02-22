import '@testing-library/jest-dom/vitest'
import { server } from './mocks/server'
import { afterEach, beforeAll, afterAll } from 'vitest'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
