package com.lepos.lepos.di

import com.lepos.lepos.data.repository.LoginRepositoryImpl
import com.lepos.lepos.data.remote.AuthRemoteDataSource
import com.lepos.lepos.domain.repository.LoginRepository
import com.lepos.lepos.domain.usecase.HomeUseCase
import com.lepos.lepos.domain.usecase.LoginUseCase
import org.koin.core.context.startKoin
import org.koin.dsl.KoinAppDeclaration
import org.koin.dsl.module

import com.lepos.lepos.domain.repository.TokenStorage

object CommonProvider {
    fun provideTokenStorage(): TokenStorage = TokenStorage()
    fun provideLoginRepository(authRemoteDataSource: AuthRemoteDataSource, tokenStorage: TokenStorage): LoginRepository {
        return LoginRepositoryImpl(authRemoteDataSource, tokenStorage)
    }
    fun provideLoginUseCase(repo: LoginRepository): LoginUseCase = LoginUseCase(repo)
    fun provideHomeUseCase(): HomeUseCase = HomeUseCase()
}

val commonModule = module {
    // Storage
    single { CommonProvider.provideTokenStorage() }

    // Repositories
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
