interface LoginForm {
    userName: string,
    password: string
}

interface LoginResponse {
    success: boolean,
    data?: {
        userId: string,
        name: string,
        email: string,
        role: string,
        token: string
    },
    message?: string
}

export type{
    LoginForm,
    LoginResponse
}