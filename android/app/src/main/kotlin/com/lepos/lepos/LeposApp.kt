package com.lepos.lepos

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory
import com.google.firebase.remoteconfig.FirebaseRemoteConfig
import com.google.firebase.remoteconfig.remoteConfigSettings
import com.google.android.gms.ads.MobileAds
import com.lepos.lepos.di.androidModule
import com.lepos.lepos.di.initKoin
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger

class LeposApp : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // 1. Initialize Firebase
        FirebaseApp.initializeApp(this)
        
        // 2. App Check Configuration
        val appCheck = FirebaseAppCheck.getInstance()
        appCheck.installAppCheckProviderFactory(
            PlayIntegrityAppCheckProviderFactory.getInstance()
        )

        // 3. Remote Config Setup
        val remoteConfig = FirebaseRemoteConfig.getInstance()
        val configSettings = remoteConfigSettings {
            minimumFetchIntervalInSeconds = 3600
        }
        remoteConfig.setConfigSettingsAsync(configSettings)
        
        // 4. AdMob Initialization
        MobileAds.initialize(this) {}

        // 5. Koin Initialization
        initKoin(baseUrl = "https://lepos.vidub.ai/api/v1/") {
            androidLogger()
            androidContext(this@LeposApp)
            modules(androidModule)
        }
    }
}
