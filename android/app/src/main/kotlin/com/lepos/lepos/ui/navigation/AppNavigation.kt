package com.lepos.lepos.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.lepos.lepos.navigation.Route
import com.lepos.lepos.ui.home.HomeScreen
import com.lepos.lepos.ui.login.LoginScreen
import com.lepos.lepos.ui.main.MainScreen
import com.lepos.lepos.ui.miniappdetails.MiniAppDetailsScreen
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController, startDestination = Route.Onboarding
    ) {
        composable<Route.Onboarding> {
            com.lepos.lepos.ui.onboarding.OnboardingScreen(
                onCompleted = {
                    navController.navigate(Route.Main) {
                        popUpTo(Route.Onboarding) { inclusive = true }
                    }
                }
            )
        }

        composable<Route.TopCharts> {
            com.lepos.lepos.ui.discovery.TopChartsScreen(
                onNavigateBack = { navController.popBackStack() },
                onAppClick = { appId ->
                    navController.navigate(Route.Detail(itemId = "app_id")) // Placeholder or use mocked ID
                }
            )
        }

        composable<Route.Main> {
            MainScreen(
                onNavigateToActivity = {
                    navController.navigate(Route.Updates)
                },
                onNavigateToCollection = { id, title ->
                    navController.navigate(Route.CollectionDetail(id = id, title = title))
                },
                onNavigateToCategory = { id, title ->
                    navController.navigate(Route.CategoryDetail(id = id, title = title))
                },
                onNavigateToSettings = {
                    navController.navigate(Route.Settings)
                },
                onNavigateToMyReviews = {
                    navController.navigate(Route.MyReviews)
                },
                onNavigateToNotifications = {
                    navController.navigate(Route.NotificationPreferences)
                },
                onNavigateToTopCharts = {
                    navController.navigate(Route.TopCharts)
                },
                onNavigateToSupport = {
                    navController.navigate(Route.HelpSupport)
                },
                onNavigateToAccountOverview = {
                    navController.navigate(Route.AccountOverview)
                },
                onNavigateToAbout = {
                    navController.navigate(Route.AboutApp)
                },
                onLogout = {
                    navController.navigate(Route.Login) {
                        popUpTo(Route.Main) { inclusive = true }
                    }
                },
                onItemClick = { itemId ->
                    navController.navigate(Route.Detail(itemId))
                }
            )
        }

        composable<Route.Login> {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Route.Main) {
                        popUpTo(Route.Login) { inclusive = true }
                    }
                },
                onNavigateToForgotPassword = {
                    navController.navigate(Route.ForgotPassword)
                }
            )
        }

        composable<Route.ForgotPassword> {
            com.lepos.lepos.ui.login.ForgotPasswordScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.Activity> {
            com.lepos.lepos.ui.activity.ActivityScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.Updates> {
            com.lepos.lepos.ui.updates.UpdatesScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.HelpSupport> {
            com.lepos.lepos.ui.settings.HelpSupportScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.AboutApp> {
            com.lepos.lepos.ui.settings.AboutAppScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToLegal = { type ->
                    navController.navigate(Route.Legal(type = type))
                }
            )
        }

        composable<Route.Legal> { backStackEntry ->
            val route: Route.Legal = backStackEntry.toRoute()
            com.lepos.lepos.ui.settings.LegalScreen(
                type = route.type,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.Settings> {
            com.lepos.lepos.ui.settings.SettingsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToEditProfile = {
                    navController.navigate(Route.EditProfile)
                },
                onNavigateToDownloadHistory = {
                    navController.navigate(Route.DownloadHistory)
                },
                onNavigateToAbout = {
                    navController.navigate(Route.AboutApp)
                },
                onNavigateToSecurity = {
                    navController.navigate(Route.Security)
                },
                onNavigateToDevices = {
                    navController.navigate(Route.Devices)
                },
                onNavigateToDeleteAccount = {
                    navController.navigate(Route.DeleteAccount)
                }
            )
        }

        composable<Route.EditProfile> {
            com.lepos.lepos.ui.profile.EditProfileScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.AccountOverview> {
            com.lepos.lepos.ui.profile.AccountOverviewScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onEditProfile = {
                    navController.navigate(Route.EditProfile)
                }
            )
        }

        composable<Route.DownloadHistory> {
            com.lepos.lepos.ui.settings.DownloadHistoryScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.WriteReview> { backStackEntry ->
            val route: Route.WriteReview = backStackEntry.toRoute()
            com.lepos.lepos.ui.reviews.WriteReviewScreen(
                appId = route.appId,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.Developer> { backStackEntry ->
            val route: Route.Developer = backStackEntry.toRoute()
            com.lepos.lepos.ui.developer.DeveloperProfileScreen(
                developerId = route.id,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.AllReviews> { backStackEntry ->
            val route: Route.AllReviews = backStackEntry.toRoute()
            com.lepos.lepos.ui.reviews.AllReviewsScreen(
                appId = route.appId,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.Detail> { backStackEntry ->
            val detail: Route.Detail = backStackEntry.toRoute()
            if (detail.itemId == "editor_choice") {
                com.lepos.lepos.ui.editor_choice.EditorChoiceScreen(
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            } else {
                MiniAppDetailsScreen(
                    bundleId = detail.itemId,
                    onBack = {
                        navController.popBackStack()
                    },
                    onWriteReview = {
                        // Assuming current detail has an ID. Since Route.Detail has itemId, we use it.
                        // Ideally we pass the actual app ID, but for now we use the one from route.
                        navController.navigate(Route.WriteReview(appId = detail.itemId))
                    },
                    onDeveloperClick = {
                        navController.navigate(Route.Developer(id = "mock_dev"))
                    },
                    onSeeAllReviews = {
                        navController.navigate(Route.AllReviews(appId = detail.itemId))
                    },
                    onCheckout = { price ->
                        navController.navigate(Route.Checkout(appId = detail.itemId, price = price))
                    },
                    onOpenMiniApp = { manifest ->
                        val bundlePath = "/data/user/0/com.lepos.lepos/files/bundles/${manifest.id}" 
                        val manifestJson = kotlinx.serialization.json.Json.encodeToString(manifest)
                        navController.navigate(Route.MiniApp(manifestJson = manifestJson, bundlePath = bundlePath))
                    }
                )
            }
        }

        // Keep other routes if needed for deep links or sub-navigation
        composable<Route.Home> {
            // Home is now part of MainScreen, but keeping this for back-compat or deep links
            HomeScreen(
                onItemClick = { itemId ->
                    println("Clicked item: $itemId")
                },
                onNotificationClick = {
                    navController.navigate(Route.NotificationPreferences)
                },
                onCollectionClick = { id, title ->
                    navController.navigate(Route.CollectionDetail(id, title))
                }
            )
        }

        composable<Route.Profile> { backStackEntry ->
            val profile: Route.Profile = backStackEntry.toRoute()
            // ProfileScreen(userId = profile.userId)
        }

        composable<Route.Checkout> { backStackEntry ->
            val route: Route.Checkout = backStackEntry.toRoute()
            com.lepos.lepos.ui.checkout.CheckoutScreen(
                appId = route.appId,
                price = route.price,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToPaymentMethods = {
                    navController.navigate(Route.PaymentMethods)
                }
            )
        }

        composable<Route.PaymentMethods> {
            com.lepos.lepos.ui.payment.PaymentMethodsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToAddCard = {
                    navController.navigate(Route.AddCard)
                },
                onNavigateToConnectWallet = {
                    navController.navigate(Route.ConnectWallet)
                }
            )
        }

        composable<Route.AddCard> {
            com.lepos.lepos.ui.payment.AddCardScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToVerification = {
                    navController.navigate(Route.Verification)
                }
            )
        }

        composable<Route.ConnectWallet> {
            com.lepos.lepos.ui.payment.ConnectWalletScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.Verification> {
            com.lepos.lepos.ui.payment.VerificationScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToResult = { isSuccess ->
                    if (isSuccess) {
                        navController.navigate(Route.PaymentSuccess)
                    } else {
                        navController.navigate(Route.PaymentFailed)
                    }
                }
            )
        }

        composable<Route.PaymentSuccess> {
            com.lepos.lepos.ui.payment.PaymentResultScreen(
                type = com.lepos.lepos.ui.payment.PaymentResultType.SUCCESS,
                onNavigateBack = { },
                onNavigateHome = {
                    // Navigate to home (mock pop to root)
                    navController.popBackStack(Route.Main, false)
                }
            )
        }

        composable<Route.PaymentFailed> {
            com.lepos.lepos.ui.payment.PaymentResultScreen(
                type = com.lepos.lepos.ui.payment.PaymentResultType.FAILURE,
                onNavigateBack = { navController.popBackStack() }, // Retry goes back to verification or add card? Verification for now
                onNavigateHome = {
                    navController.popBackStack(Route.Main, false)
                }
            )
        }

        composable<Route.MiniApp> { backStackEntry ->
            val route: Route.MiniApp = backStackEntry.toRoute()
            // We need to parse the manifest from JSON string
            val manifest = kotlinx.serialization.json.Json.decodeFromString<com.lepos.lepos.domain.model.WebRuntimeManifest>(route.manifestJson)
            com.lepos.lepos.ui.webruntime.RuntimeScreen(
                manifest = manifest,
                bundlePath = route.bundlePath,
                onClose = {
                    navController.popBackStack()
                }
            )
        }

        composable<Route.DeleteAccount> {
            com.lepos.lepos.ui.settings.DeleteAccountScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable<Route.Security> {
            com.lepos.lepos.ui.settings.SecuritySettingsScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToActivity = { navController.navigate(Route.Activity) }
            )
        }

        composable<Route.Devices> {
            com.lepos.lepos.ui.settings.DeviceManagementScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable<Route.NotificationPreferences> {
             // Re-using exiting route, ensure screen exists or use placeholder
             com.lepos.lepos.ui.notifications.NotificationPreferencesScreen(
                 onNavigateBack = { navController.popBackStack() }
             )
        }
        
        // System Routes (Placeholders for now if screens don't exist, strictly following docs)
        composable<Route.GlobalError> {
             // com.lepos.lepos.ui.system.GlobalErrorScreen(...) // Uncomment when created
             androidx.compose.foundation.layout.Box(modifier = androidx.compose.ui.Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                 androidx.compose.material3.Text("Global Error Screen")
                 androidx.compose.material3.Button(onClick = { navController.popBackStack() }) {
                     androidx.compose.material3.Text("Dismiss")
                 }
             }
        }

        composable<Route.NoInternet> {
             // com.lepos.lepos.ui.system.NoInternetScreen(...) // Uncomment when created
             androidx.compose.foundation.layout.Box(modifier = androidx.compose.ui.Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                 androidx.compose.material3.Text("No Internet Screen")
                 androidx.compose.material3.Button(onClick = { navController.popBackStack() }) {
                     androidx.compose.material3.Text("Retry")
                 }
             }
        }
        
    }
}
