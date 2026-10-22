/** Shape of the decoded JWT. `sub` is the TeamMember id (the standard claim). */
export interface JwtPayload {
    sub: number;
    email: string;
}
