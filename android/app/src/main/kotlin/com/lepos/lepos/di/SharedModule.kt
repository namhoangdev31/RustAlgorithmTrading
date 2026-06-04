package com.lepos.lepos.di

import com.lepos.lepos.core.DefaultDispatcherProvider
import com.lepos.lepos.core.DispatcherProvider

import com.lepos.lepos.data.network.KtorClientFactory
import com.lepos.lepos.data.remote.ApiService
import com.lepos.lepos.data.remote.AuthRemoteDataSource
import com.lepos.lepos.data.remote.BundleApiService
import com.lepos.lepos.data.remote.MiniAppRemoteDataSource
import com.lepos.lepos.data.remote.WalletRemoteDataSource
import com.lepos.lepos.data.repository.BundleRepositoryImpl
import com.lepos.lepos.data.repository.MiniAppRepositoryImpl
import com.lepos.lepos.data.repository.TodayRepositoryImpl
import com.lepos.lepos.data.repository.UserRepositoryImpl
import com.lepos.lepos.data.repository.WalletRepositoryImpl
import com.lepos.lepos.domain.port.BundleDownloader
import com.lepos.lepos.domain.repository.BundleRepository
import com.lepos.lepos.domain.repository.MiniAppRepository
import com.lepos.lepos.domain.repository.TodayRepository
import com.lepos.lepos.domain.repository.UserRepository
import com.lepos.lepos.domain.repository.WalletRepository
import com.lepos.lepos.domain.usecase.today.GetTopCollectionsUseCase
import com.lepos.lepos.domain.usecase.today.GetPersonalizedAppsUseCase
import com.lepos.lepos.domain.usecase.today.GetFeaturedAppUseCase
import com.lepos.lepos.domain.usecase.today.GetAppsWeLoveUseCase
import com.lepos.lepos.domain.usecase.*
import io.ktor.client.HttpClient
import org.koin.dsl.module

object SharedProvider {
    fun provideDispatcherProvider(): DispatcherProvider = DefaultDispatcherProvider()

    fun provideHttpClient(baseUrl: String): HttpClient {
        return KtorClientFactory.create(baseUrl)
    }

    fun provideApiService(client: HttpClient): ApiService = ApiService(client)
    fun provideBundleApiService(client: HttpClient): BundleApiService = BundleApiService(client)
    fun provideAuthRemoteDataSource(client: HttpClient): AuthRemoteDataSource = AuthRemoteDataSource(client)
    fun provideWalletRemoteDataSource(client: HttpClient): WalletRemoteDataSource = WalletRemoteDataSource(client)
    fun provideMiniAppRemoteDataSource(client: HttpClient): MiniAppRemoteDataSource = MiniAppRemoteDataSource(client)

    fun provideUserRepository(apiService: ApiService): UserRepository = UserRepositoryImpl(apiService)
    fun provideBundleRepository(apiService: BundleApiService): BundleRepository = BundleRepositoryImpl(apiService)
    fun provideWalletRepository(remoteDataSource: WalletRemoteDataSource): WalletRepository = WalletRepositoryImpl(remoteDataSource)
    fun provideMiniAppRepository(remoteDataSource: MiniAppRemoteDataSource): MiniAppRepository = MiniAppRepositoryImpl(remoteDataSource)
    
    fun provideGetUsersUseCase(repo: UserRepository): GetUsersUseCase = GetUsersUseCase(repo)
    fun provideGetBundlesUseCase(repo: BundleRepository): GetBundlesUseCase = GetBundlesUseCase(repo)
    fun provideDownloadBundleUseCase(repo: BundleRepository, downloader: BundleDownloader): DownloadBundleUseCase = DownloadBundleUseCase(repo, downloader)
    fun provideGetBundleStatsUseCase(repo: BundleRepository): GetBundleStatsUseCase = GetBundleStatsUseCase(repo)
    fun provideGetBundlePromotionsUseCase(repo: BundleRepository): GetBundlePromotionsUseCase = GetBundlePromotionsUseCase(repo)
    fun provideTrackBundleDownloadUseCase(repo: BundleRepository): TrackBundleDownloadUseCase = TrackBundleDownloadUseCase(repo)

    fun provideTodayRepository(apiService: ApiService): TodayRepository = TodayRepositoryImpl(apiService)

    fun provideGetFeaturedAppUseCase(repo: TodayRepository): GetFeaturedAppUseCase = GetFeaturedAppUseCase(repo)
    fun provideGetAppsWeLoveUseCase(repo: TodayRepository): GetAppsWeLoveUseCase = GetAppsWeLoveUseCase(repo)
    fun provideGetTopCollectionsUseCase(repo: TodayRepository): GetTopCollectionsUseCase = GetTopCollectionsUseCase(repo)
    fun provideGetPersonalizedAppsUseCase(repo: TodayRepository): GetPersonalizedAppsUseCase = GetPersonalizedAppsUseCase(repo)
    fun provideWalletUseCase(repo: WalletRepository): WalletUseCase = WalletUseCase(repo)
    fun provideMiniAppUseCase(repo: MiniAppRepository): MiniAppUseCase = MiniAppUseCase(repo)
}

fun sharedModule(baseUrl: String) = module {
    // Config
    single { baseUrl }

    // Core
    single<DispatcherProvider> { SharedProvider.provideDispatcherProvider() }

    // Network
    single { SharedProvider.provideHttpClient(get()) }

    single { SharedProvider.provideApiService(get()) }
    single { SharedProvider.provideBundleApiService(get()) }
    single { SharedProvider.provideAuthRemoteDataSource(get()) }
    single { SharedProvider.provideWalletRemoteDataSource(get()) }
    single { SharedProvider.provideMiniAppRemoteDataSource(get()) }

    // Repository
    single<UserRepository> { SharedProvider.provideUserRepository(get()) }
    single<BundleRepository> { SharedProvider.provideBundleRepository(get()) }
    single<TodayRepository> { SharedProvider.provideTodayRepository(get()) }
    single<WalletRepository> { SharedProvider.provideWalletRepository(get()) }
    single<MiniAppRepository> { SharedProvider.provideMiniAppRepository(get()) }

    // UseCase
    factory { SharedProvider.provideGetUsersUseCase(get()) }
    factory { SharedProvider.provideGetBundlesUseCase(get()) }
    factory { SharedProvider.provideDownloadBundleUseCase(get(), get()) }
    factory { SharedProvider.provideGetBundleStatsUseCase(get()) }
    factory { SharedProvider.provideGetBundlePromotionsUseCase(get()) }
    factory { SharedProvider.provideTrackBundleDownloadUseCase(get()) }

    factory { SharedProvider.provideGetFeaturedAppUseCase(get()) }
    factory { SharedProvider.provideGetAppsWeLoveUseCase(get()) }
    factory { SharedProvider.provideGetTopCollectionsUseCase(get()) }
    factory { SharedProvider.provideGetPersonalizedAppsUseCase(get()) }
    factory { SharedProvider.provideWalletUseCase(get()) }
    factory { SharedProvider.provideMiniAppUseCase(get()) }
}
