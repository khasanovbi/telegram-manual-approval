import type { User } from '@telegraf/types'

export interface GithubUsernameResolver {
    resolve(user: User): string
}

export class InmemoryGithubUsernameResolver implements GithubUsernameResolver {
    constructor(
        private readonly telegramUserIDToGithubUsername: Map<number, string>,
        private readonly telegramUsernameToGithubUsername: Map<string, string>
    ) {}

    resolve(user: User): string {
        let githubUsername = this.telegramUserIDToGithubUsername.get(user.id)
        if (githubUsername) {
            return githubUsername
        }

        githubUsername = this.telegramUsernameToGithubUsername.get(user.username as string)
        if (githubUsername) {
            return githubUsername
        }

        return ''
    }
}
