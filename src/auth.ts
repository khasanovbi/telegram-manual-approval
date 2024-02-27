import type { User } from '@telegraf/types'
import { GithubUsernameResolver } from './resolver'
import { TextConfig } from './config'

export interface AuthorizationBackend {
    authorize(approver: User): string
}

export class InmemoryAuthorizationBackend implements AuthorizationBackend {
    constructor(
        private readonly actor: string,
        private readonly githubUsernameResolver: GithubUsernameResolver,
        private readonly allowSelfApprove: boolean,
        private readonly approvers: Set<string>,
        private readonly superApprovers: Set<string>,
        private readonly textConfig: TextConfig
    ) {
        this.approvers = new Set<string>([...approvers, ...superApprovers])
    }

    authorize(approver: User): string {
        if (this.approvers.size === 0 && this.allowSelfApprove) {
            return ''
        }

        const approverGithubUsername = this.githubUsernameResolver.resolve(approver)

        if (approverGithubUsername === '') {
            return this.textConfig.approverNotFoundInMapText
        }

        if (this.approvers.size > 0 && !this.approvers.has(approverGithubUsername)) {
            return this.textConfig.approverPermissionDeniedText
        }

        if (this.allowSelfApprove || this.actor !== approverGithubUsername) {
            return ''
        }

        if (this.superApprovers.has(approverGithubUsername)) {
            return ''
        }

        return this.textConfig.actorCantDoSelfApproveText
    }
}
