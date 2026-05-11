package com.lepos.lepos.di

import com.lepos.lepos.data.AndroidBundleDownloader
import com.lepos.lepos.domain.port.BundleDownloader
import com.lepos.lepos.ui.home.HomeViewModel
import com.lepos.lepos.ui.login.LoginViewModel
import com.lepos.lepos.ui.miniappdetails.MiniAppDetailsViewModel
import com.lepos.lepos.ui.store.MiniAppStoreViewModel
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

val androidModule = module {
    viewModel { LoginViewModel(get()) }
    viewModel { HomeViewModel(get()) }
    viewModel { MiniAppStoreViewModel(get(), get()) }
    viewModel { MiniAppDetailsViewModel(get(), get(), get(), get(), get()) }

    single<BundleDownloader> {
        AndroidBundleDownloader(
            context = get(),
            dispatchers = get(),
            baseUrl = get()
        )
    }
}
