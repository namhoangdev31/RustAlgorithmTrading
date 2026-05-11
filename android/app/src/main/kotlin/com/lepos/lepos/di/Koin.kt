package com.lepos.lepos.di

import com.lepos.lepos.data.repository.LoginRepositoryImpl
import com.lepos.lepos.domain.repository.LoginRepository
import com.lepos.lepos.domain.usecase.HomeUseCase
import com.lepos.lepos.domain.usecase.LoginUseCase
import org.koin.core.context.startKoin
import org.koin.dsl.KoinAppDeclaration
import org.koin.dsl.module

import com.lepos.lepos.domain.repository.TokenStorage
import io.ktor.client.HttpClient

object CommonProvider {
    fun provideTokenStorage(): TokenStorage = TokenStorage()
    fun provideLoginRepository(httpClient: HttpClient, tokenStorage: TokenStorage): LoginRepository = LoginRepositoryImpl(httpClient, tokenStorage)
    fun provideLoginUseCase(repo: LoginRepository): LoginUseCase = LoginUseCase(repo)
    fun provideHomeUseCase(): HomeUseCase = HomeUseCase()
}

val commonModule = module {
    // Storage
    single { CommonProvider.provideTokenStorage() }

    // Repositories (depends on HttpClient provided by sharedModule)
    single<LoginRepository> { CommonProvider.provideLoginRepository(get(), get()) }
    
    // UseCases
    factory { CommonProvider.provideLoginUseCase(get()) }
    factory { CommonProvider.provideHomeUseCase() }
}

fun initKoin(baseUrl: String, appDeclaration: KoinAppDeclaration = {}) = startKoin {
    appDeclaration()
    modules(
        commonModule,
        sharedModule(baseUrl)
    )
}
