/* eslint-disable */
import type { Prisma, Order, RiskEvent, File, User, BundlePayouts, Bundles, Notifications, Session, UserDeviceToken, BundleAbTests, BundleAbuseSignals, BundleAdConfigurations, BundleAnalyticsEvents, BundleApiUsageStats, BundleAuditLog, BundleBetaTesters, BundleChangeLogs, BundleCollaborators, BundleContentRatings, BundleCountries, BundleDependencies, BundleDeveloperStrikes, BundleDeviceSupport, BundleExternalIntegrations, BundleFeaturedSlots, BundleInAppPurchases, BundleInstallEvents, BundleLanguages, BundleLocalizations, BundleMonetizationConfigs, BundleOrders, BundlePermissions, BundlePrivacyDeclarations, BundlePromotions, BundleRankingScores, BundleReleaseTracks, BundleRetentionStats, BundleReviews, BundleRuntimeConfig, BundleScreenshots, BundleSearchKeywords, BundleStateTransitions, BundleStats, BundleStoreFlags, BundleStoreListings, BundleSubscriptionPlans, BundleTags, BundleTrendingSnapshots, BundleUserReports, BundleVersionHistory, BundleWebhooks, BundleOrderItems, BundlePaymentLogs, BundleRefundRequests, BundleUserEntitlements, BundleRollouts, BundleReviewReports, BundleSubscriptionHistory, BundleCrashReports, BundleReviewHistory, BundleReviewQueue, BundleSecurityScanResults, BundleUpdatePhases } from "../prisma/generated/client.js";
import type { PothosPrismaDatamodel } from "@pothos/plugin-prisma";
export default interface PrismaTypes {
    Order: {
        Name: "Order";
        Shape: Order;
        Include: never;
        Select: Prisma.OrderSelect;
        OrderBy: Prisma.OrderOrderByWithRelationInput;
        WhereUnique: Prisma.OrderWhereUniqueInput;
        Where: Prisma.OrderWhereInput;
        Create: {};
        Update: {};
        RelationName: never;
        ListRelations: never;
        Relations: {};
    };
    RiskEvent: {
        Name: "RiskEvent";
        Shape: RiskEvent;
        Include: never;
        Select: Prisma.RiskEventSelect;
        OrderBy: Prisma.RiskEventOrderByWithRelationInput;
        WhereUnique: Prisma.RiskEventWhereUniqueInput;
        Where: Prisma.RiskEventWhereInput;
        Create: {};
        Update: {};
        RelationName: never;
        ListRelations: never;
        Relations: {};
    };
    File: {
        Name: "File";
        Shape: File;
        Include: Prisma.FileInclude;
        Select: Prisma.FileSelect;
        OrderBy: Prisma.FileOrderByWithRelationInput;
        WhereUnique: Prisma.FileWhereUniqueInput;
        Where: Prisma.FileWhereInput;
        Create: {};
        Update: {};
        RelationName: "usersWithPhoto";
        ListRelations: "usersWithPhoto";
        Relations: {
            usersWithPhoto: {
                Shape: User[];
                Name: "User";
                Nullable: false;
            };
        };
    };
    User: {
        Name: "User";
        Shape: User;
        Include: Prisma.UserInclude;
        Select: Prisma.UserSelect;
        OrderBy: Prisma.UserOrderByWithRelationInput;
        WhereUnique: Prisma.UserWhereUniqueInput;
        Where: Prisma.UserWhereInput;
        Create: {};
        Update: {};
        RelationName: "photo" | "payouts" | "bundles" | "notificationsActor" | "notificationsRecipient" | "sessions" | "deviceTokens" | "analytics" | "auditLogs" | "betaTesters" | "changedLogs" | "collaboratorsInvited" | "collaborators" | "developerStrikes" | "developerStrikesIssued" | "installEvents" | "orders" | "reviews" | "stateTransitions" | "userReportsReported" | "userReportsReviewed" | "refundRequestsReviewed" | "refundRequests" | "userEntitlements" | "reviewReportsReported" | "reviewReportsReviewed" | "subscriptionHistory" | "reviewHistory" | "reviewQueueReviewed";
        ListRelations: "payouts" | "bundles" | "notificationsActor" | "notificationsRecipient" | "sessions" | "deviceTokens" | "analytics" | "auditLogs" | "betaTesters" | "changedLogs" | "collaboratorsInvited" | "collaborators" | "developerStrikes" | "developerStrikesIssued" | "installEvents" | "orders" | "reviews" | "stateTransitions" | "userReportsReported" | "userReportsReviewed" | "refundRequestsReviewed" | "refundRequests" | "userEntitlements" | "reviewReportsReported" | "reviewReportsReviewed" | "subscriptionHistory" | "reviewHistory" | "reviewQueueReviewed";
        Relations: {
            photo: {
                Shape: File | null;
                Name: "File";
                Nullable: true;
            };
            payouts: {
                Shape: BundlePayouts[];
                Name: "BundlePayouts";
                Nullable: false;
            };
            bundles: {
                Shape: Bundles[];
                Name: "Bundles";
                Nullable: false;
            };
            notificationsActor: {
                Shape: Notifications[];
                Name: "Notifications";
                Nullable: false;
            };
            notificationsRecipient: {
                Shape: Notifications[];
                Name: "Notifications";
                Nullable: false;
            };
            sessions: {
                Shape: Session[];
                Name: "Session";
                Nullable: false;
            };
            deviceTokens: {
                Shape: UserDeviceToken[];
                Name: "UserDeviceToken";
                Nullable: false;
            };
            analytics: {
                Shape: BundleAnalyticsEvents[];
                Name: "BundleAnalyticsEvents";
                Nullable: false;
            };
            auditLogs: {
                Shape: BundleAuditLog[];
                Name: "BundleAuditLog";
                Nullable: false;
            };
            betaTesters: {
                Shape: BundleBetaTesters[];
                Name: "BundleBetaTesters";
                Nullable: false;
            };
            changedLogs: {
                Shape: BundleChangeLogs[];
                Name: "BundleChangeLogs";
                Nullable: false;
            };
            collaboratorsInvited: {
                Shape: BundleCollaborators[];
                Name: "BundleCollaborators";
                Nullable: false;
            };
            collaborators: {
                Shape: BundleCollaborators[];
                Name: "BundleCollaborators";
                Nullable: false;
            };
            developerStrikes: {
                Shape: BundleDeveloperStrikes[];
                Name: "BundleDeveloperStrikes";
                Nullable: false;
            };
            developerStrikesIssued: {
                Shape: BundleDeveloperStrikes[];
                Name: "BundleDeveloperStrikes";
                Nullable: false;
            };
            installEvents: {
                Shape: BundleInstallEvents[];
                Name: "BundleInstallEvents";
                Nullable: false;
            };
            orders: {
                Shape: BundleOrders[];
                Name: "BundleOrders";
                Nullable: false;
            };
            reviews: {
                Shape: BundleReviews[];
                Name: "BundleReviews";
                Nullable: false;
            };
            stateTransitions: {
                Shape: BundleStateTransitions[];
                Name: "BundleStateTransitions";
                Nullable: false;
            };
            userReportsReported: {
                Shape: BundleUserReports[];
                Name: "BundleUserReports";
                Nullable: false;
            };
            userReportsReviewed: {
                Shape: BundleUserReports[];
                Name: "BundleUserReports";
                Nullable: false;
            };
            refundRequestsReviewed: {
                Shape: BundleRefundRequests[];
                Name: "BundleRefundRequests";
                Nullable: false;
            };
            refundRequests: {
                Shape: BundleRefundRequests[];
                Name: "BundleRefundRequests";
                Nullable: false;
            };
            userEntitlements: {
                Shape: BundleUserEntitlements[];
                Name: "BundleUserEntitlements";
                Nullable: false;
            };
            reviewReportsReported: {
                Shape: BundleReviewReports[];
                Name: "BundleReviewReports";
                Nullable: false;
            };
            reviewReportsReviewed: {
                Shape: BundleReviewReports[];
                Name: "BundleReviewReports";
                Nullable: false;
            };
            subscriptionHistory: {
                Shape: BundleSubscriptionHistory[];
                Name: "BundleSubscriptionHistory";
                Nullable: false;
            };
            reviewHistory: {
                Shape: BundleReviewHistory[];
                Name: "BundleReviewHistory";
                Nullable: false;
            };
            reviewQueueReviewed: {
                Shape: BundleReviewQueue[];
                Name: "BundleReviewQueue";
                Nullable: false;
            };
        };
    };
    BundlePayouts: {
        Name: "BundlePayouts";
        Shape: BundlePayouts;
        Include: Prisma.BundlePayoutsInclude;
        Select: Prisma.BundlePayoutsSelect;
        OrderBy: Prisma.BundlePayoutsOrderByWithRelationInput;
        WhereUnique: Prisma.BundlePayoutsWhereUniqueInput;
        Where: Prisma.BundlePayoutsWhereInput;
        Create: {};
        Update: {};
        RelationName: "developer";
        ListRelations: never;
        Relations: {
            developer: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    Bundles: {
        Name: "Bundles";
        Shape: Bundles;
        Include: Prisma.BundlesInclude;
        Select: Prisma.BundlesSelect;
        OrderBy: Prisma.BundlesOrderByWithRelationInput;
        WhereUnique: Prisma.BundlesWhereUniqueInput;
        Where: Prisma.BundlesWhereInput;
        Create: {};
        Update: {};
        RelationName: "developer" | "abTests" | "abuseSignals" | "adConfigurations" | "analyticsEvents" | "apiUsageStats" | "auditLogs" | "betaTesters" | "changeLogs" | "collaborators" | "contentRatings" | "countries" | "dependencies" | "dependentBundles" | "developerStrikes" | "deviceSupports" | "externalIntegrations" | "featuredSlots" | "inAppPurchases" | "installEvents" | "languages" | "localizations" | "monetizationConfigs" | "orders" | "permissions" | "privacyDeclarations" | "promotions" | "rankingScores" | "releaseTracks" | "retentionStats" | "reviews" | "runtimeConfig" | "screenshots" | "searchKeywords" | "stateTransitions" | "stats" | "storeFlags" | "storeListings" | "subscriptionPlans" | "tags" | "trendingSnapshots" | "userReports" | "versionHistories" | "webhooks" | "userEntitlements" | "rollouts" | "subscriptionHistory" | "crashReports" | "reviewHistory" | "reviewQueue" | "securityScanResults" | "updatePhases";
        ListRelations: "abTests" | "analyticsEvents" | "apiUsageStats" | "auditLogs" | "betaTesters" | "changeLogs" | "collaborators" | "contentRatings" | "countries" | "dependencies" | "dependentBundles" | "developerStrikes" | "deviceSupports" | "externalIntegrations" | "featuredSlots" | "inAppPurchases" | "installEvents" | "languages" | "localizations" | "orders" | "permissions" | "promotions" | "releaseTracks" | "retentionStats" | "reviews" | "screenshots" | "searchKeywords" | "stateTransitions" | "storeListings" | "subscriptionPlans" | "tags" | "trendingSnapshots" | "userReports" | "versionHistories" | "webhooks" | "userEntitlements" | "rollouts" | "subscriptionHistory" | "crashReports" | "reviewHistory" | "reviewQueue" | "securityScanResults" | "updatePhases";
        Relations: {
            developer: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
            abTests: {
                Shape: BundleAbTests[];
                Name: "BundleAbTests";
                Nullable: false;
            };
            abuseSignals: {
                Shape: BundleAbuseSignals | null;
                Name: "BundleAbuseSignals";
                Nullable: true;
            };
            adConfigurations: {
                Shape: BundleAdConfigurations | null;
                Name: "BundleAdConfigurations";
                Nullable: true;
            };
            analyticsEvents: {
                Shape: BundleAnalyticsEvents[];
                Name: "BundleAnalyticsEvents";
                Nullable: false;
            };
            apiUsageStats: {
                Shape: BundleApiUsageStats[];
                Name: "BundleApiUsageStats";
                Nullable: false;
            };
            auditLogs: {
                Shape: BundleAuditLog[];
                Name: "BundleAuditLog";
                Nullable: false;
            };
            betaTesters: {
                Shape: BundleBetaTesters[];
                Name: "BundleBetaTesters";
                Nullable: false;
            };
            changeLogs: {
                Shape: BundleChangeLogs[];
                Name: "BundleChangeLogs";
                Nullable: false;
            };
            collaborators: {
                Shape: BundleCollaborators[];
                Name: "BundleCollaborators";
                Nullable: false;
            };
            contentRatings: {
                Shape: BundleContentRatings[];
                Name: "BundleContentRatings";
                Nullable: false;
            };
            countries: {
                Shape: BundleCountries[];
                Name: "BundleCountries";
                Nullable: false;
            };
            dependencies: {
                Shape: BundleDependencies[];
                Name: "BundleDependencies";
                Nullable: false;
            };
            dependentBundles: {
                Shape: BundleDependencies[];
                Name: "BundleDependencies";
                Nullable: false;
            };
            developerStrikes: {
                Shape: BundleDeveloperStrikes[];
                Name: "BundleDeveloperStrikes";
                Nullable: false;
            };
            deviceSupports: {
                Shape: BundleDeviceSupport[];
                Name: "BundleDeviceSupport";
                Nullable: false;
            };
            externalIntegrations: {
                Shape: BundleExternalIntegrations[];
                Name: "BundleExternalIntegrations";
                Nullable: false;
            };
            featuredSlots: {
                Shape: BundleFeaturedSlots[];
                Name: "BundleFeaturedSlots";
                Nullable: false;
            };
            inAppPurchases: {
                Shape: BundleInAppPurchases[];
                Name: "BundleInAppPurchases";
                Nullable: false;
            };
            installEvents: {
                Shape: BundleInstallEvents[];
                Name: "BundleInstallEvents";
                Nullable: false;
            };
            languages: {
                Shape: BundleLanguages[];
                Name: "BundleLanguages";
                Nullable: false;
            };
            localizations: {
                Shape: BundleLocalizations[];
                Name: "BundleLocalizations";
                Nullable: false;
            };
            monetizationConfigs: {
                Shape: BundleMonetizationConfigs | null;
                Name: "BundleMonetizationConfigs";
                Nullable: true;
            };
            orders: {
                Shape: BundleOrders[];
                Name: "BundleOrders";
                Nullable: false;
            };
            permissions: {
                Shape: BundlePermissions[];
                Name: "BundlePermissions";
                Nullable: false;
            };
            privacyDeclarations: {
                Shape: BundlePrivacyDeclarations | null;
                Name: "BundlePrivacyDeclarations";
                Nullable: true;
            };
            promotions: {
                Shape: BundlePromotions[];
                Name: "BundlePromotions";
                Nullable: false;
            };
            rankingScores: {
                Shape: BundleRankingScores | null;
                Name: "BundleRankingScores";
                Nullable: true;
            };
            releaseTracks: {
                Shape: BundleReleaseTracks[];
                Name: "BundleReleaseTracks";
                Nullable: false;
            };
            retentionStats: {
                Shape: BundleRetentionStats[];
                Name: "BundleRetentionStats";
                Nullable: false;
            };
            reviews: {
                Shape: BundleReviews[];
                Name: "BundleReviews";
                Nullable: false;
            };
            runtimeConfig: {
                Shape: BundleRuntimeConfig | null;
                Name: "BundleRuntimeConfig";
                Nullable: true;
            };
            screenshots: {
                Shape: BundleScreenshots[];
                Name: "BundleScreenshots";
                Nullable: false;
            };
            searchKeywords: {
                Shape: BundleSearchKeywords[];
                Name: "BundleSearchKeywords";
                Nullable: false;
            };
            stateTransitions: {
                Shape: BundleStateTransitions[];
                Name: "BundleStateTransitions";
                Nullable: false;
            };
            stats: {
                Shape: BundleStats | null;
                Name: "BundleStats";
                Nullable: true;
            };
            storeFlags: {
                Shape: BundleStoreFlags | null;
                Name: "BundleStoreFlags";
                Nullable: true;
            };
            storeListings: {
                Shape: BundleStoreListings[];
                Name: "BundleStoreListings";
                Nullable: false;
            };
            subscriptionPlans: {
                Shape: BundleSubscriptionPlans[];
                Name: "BundleSubscriptionPlans";
                Nullable: false;
            };
            tags: {
                Shape: BundleTags[];
                Name: "BundleTags";
                Nullable: false;
            };
            trendingSnapshots: {
                Shape: BundleTrendingSnapshots[];
                Name: "BundleTrendingSnapshots";
                Nullable: false;
            };
            userReports: {
                Shape: BundleUserReports[];
                Name: "BundleUserReports";
                Nullable: false;
            };
            versionHistories: {
                Shape: BundleVersionHistory[];
                Name: "BundleVersionHistory";
                Nullable: false;
            };
            webhooks: {
                Shape: BundleWebhooks[];
                Name: "BundleWebhooks";
                Nullable: false;
            };
            userEntitlements: {
                Shape: BundleUserEntitlements[];
                Name: "BundleUserEntitlements";
                Nullable: false;
            };
            rollouts: {
                Shape: BundleRollouts[];
                Name: "BundleRollouts";
                Nullable: false;
            };
            subscriptionHistory: {
                Shape: BundleSubscriptionHistory[];
                Name: "BundleSubscriptionHistory";
                Nullable: false;
            };
            crashReports: {
                Shape: BundleCrashReports[];
                Name: "BundleCrashReports";
                Nullable: false;
            };
            reviewHistory: {
                Shape: BundleReviewHistory[];
                Name: "BundleReviewHistory";
                Nullable: false;
            };
            reviewQueue: {
                Shape: BundleReviewQueue[];
                Name: "BundleReviewQueue";
                Nullable: false;
            };
            securityScanResults: {
                Shape: BundleSecurityScanResults[];
                Name: "BundleSecurityScanResults";
                Nullable: false;
            };
            updatePhases: {
                Shape: BundleUpdatePhases[];
                Name: "BundleUpdatePhases";
                Nullable: false;
            };
        };
    };
    Notifications: {
        Name: "Notifications";
        Shape: Notifications;
        Include: Prisma.NotificationsInclude;
        Select: Prisma.NotificationsSelect;
        OrderBy: Prisma.NotificationsOrderByWithRelationInput;
        WhereUnique: Prisma.NotificationsWhereUniqueInput;
        Where: Prisma.NotificationsWhereInput;
        Create: {};
        Update: {};
        RelationName: "actor" | "recipient";
        ListRelations: never;
        Relations: {
            actor: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
            recipient: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    Session: {
        Name: "Session";
        Shape: Session;
        Include: Prisma.SessionInclude;
        Select: Prisma.SessionSelect;
        OrderBy: Prisma.SessionOrderByWithRelationInput;
        WhereUnique: Prisma.SessionWhereUniqueInput;
        Where: Prisma.SessionWhereInput;
        Create: {};
        Update: {};
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    UserDeviceToken: {
        Name: "UserDeviceToken";
        Shape: UserDeviceToken;
        Include: Prisma.UserDeviceTokenInclude;
        Select: Prisma.UserDeviceTokenSelect;
        OrderBy: Prisma.UserDeviceTokenOrderByWithRelationInput;
        WhereUnique: Prisma.UserDeviceTokenWhereUniqueInput;
        Where: Prisma.UserDeviceTokenWhereInput;
        Create: {};
        Update: {};
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    BundleAbTests: {
        Name: "BundleAbTests";
        Shape: BundleAbTests;
        Include: Prisma.BundleAbTestsInclude;
        Select: Prisma.BundleAbTestsSelect;
        OrderBy: Prisma.BundleAbTestsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleAbTestsWhereUniqueInput;
        Where: Prisma.BundleAbTestsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleAbuseSignals: {
        Name: "BundleAbuseSignals";
        Shape: BundleAbuseSignals;
        Include: Prisma.BundleAbuseSignalsInclude;
        Select: Prisma.BundleAbuseSignalsSelect;
        OrderBy: Prisma.BundleAbuseSignalsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleAbuseSignalsWhereUniqueInput;
        Where: Prisma.BundleAbuseSignalsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleAdConfigurations: {
        Name: "BundleAdConfigurations";
        Shape: BundleAdConfigurations;
        Include: Prisma.BundleAdConfigurationsInclude;
        Select: Prisma.BundleAdConfigurationsSelect;
        OrderBy: Prisma.BundleAdConfigurationsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleAdConfigurationsWhereUniqueInput;
        Where: Prisma.BundleAdConfigurationsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleAnalyticsEvents: {
        Name: "BundleAnalyticsEvents";
        Shape: BundleAnalyticsEvents;
        Include: Prisma.BundleAnalyticsEventsInclude;
        Select: Prisma.BundleAnalyticsEventsSelect;
        OrderBy: Prisma.BundleAnalyticsEventsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleAnalyticsEventsWhereUniqueInput;
        Where: Prisma.BundleAnalyticsEventsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            user: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    BundleApiUsageStats: {
        Name: "BundleApiUsageStats";
        Shape: BundleApiUsageStats;
        Include: Prisma.BundleApiUsageStatsInclude;
        Select: Prisma.BundleApiUsageStatsSelect;
        OrderBy: Prisma.BundleApiUsageStatsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleApiUsageStatsWhereUniqueInput;
        Where: Prisma.BundleApiUsageStatsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleAuditLog: {
        Name: "BundleAuditLog";
        Shape: BundleAuditLog;
        Include: Prisma.BundleAuditLogInclude;
        Select: Prisma.BundleAuditLogSelect;
        OrderBy: Prisma.BundleAuditLogOrderByWithRelationInput;
        WhereUnique: Prisma.BundleAuditLogWhereUniqueInput;
        Where: Prisma.BundleAuditLogWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            user: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    BundleBetaTesters: {
        Name: "BundleBetaTesters";
        Shape: BundleBetaTesters;
        Include: Prisma.BundleBetaTestersInclude;
        Select: Prisma.BundleBetaTestersSelect;
        OrderBy: Prisma.BundleBetaTestersOrderByWithRelationInput;
        WhereUnique: Prisma.BundleBetaTestersWhereUniqueInput;
        Where: Prisma.BundleBetaTestersWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            user: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    BundleChangeLogs: {
        Name: "BundleChangeLogs";
        Shape: BundleChangeLogs;
        Include: Prisma.BundleChangeLogsInclude;
        Select: Prisma.BundleChangeLogsSelect;
        OrderBy: Prisma.BundleChangeLogsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleChangeLogsWhereUniqueInput;
        Where: Prisma.BundleChangeLogsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            user: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    BundleCollaborators: {
        Name: "BundleCollaborators";
        Shape: BundleCollaborators;
        Include: Prisma.BundleCollaboratorsInclude;
        Select: Prisma.BundleCollaboratorsSelect;
        OrderBy: Prisma.BundleCollaboratorsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleCollaboratorsWhereUniqueInput;
        Where: Prisma.BundleCollaboratorsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "invitedUser" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            invitedUser: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    BundleContentRatings: {
        Name: "BundleContentRatings";
        Shape: BundleContentRatings;
        Include: Prisma.BundleContentRatingsInclude;
        Select: Prisma.BundleContentRatingsSelect;
        OrderBy: Prisma.BundleContentRatingsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleContentRatingsWhereUniqueInput;
        Where: Prisma.BundleContentRatingsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleCountries: {
        Name: "BundleCountries";
        Shape: BundleCountries;
        Include: Prisma.BundleCountriesInclude;
        Select: Prisma.BundleCountriesSelect;
        OrderBy: Prisma.BundleCountriesOrderByWithRelationInput;
        WhereUnique: Prisma.BundleCountriesWhereUniqueInput;
        Where: Prisma.BundleCountriesWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleDependencies: {
        Name: "BundleDependencies";
        Shape: BundleDependencies;
        Include: Prisma.BundleDependenciesInclude;
        Select: Prisma.BundleDependenciesSelect;
        OrderBy: Prisma.BundleDependenciesOrderByWithRelationInput;
        WhereUnique: Prisma.BundleDependenciesWhereUniqueInput;
        Where: Prisma.BundleDependenciesWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "dependencyBundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            dependencyBundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleDeveloperStrikes: {
        Name: "BundleDeveloperStrikes";
        Shape: BundleDeveloperStrikes;
        Include: Prisma.BundleDeveloperStrikesInclude;
        Select: Prisma.BundleDeveloperStrikesSelect;
        OrderBy: Prisma.BundleDeveloperStrikesOrderByWithRelationInput;
        WhereUnique: Prisma.BundleDeveloperStrikesWhereUniqueInput;
        Where: Prisma.BundleDeveloperStrikesWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "developer" | "issuer";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles | null;
                Name: "Bundles";
                Nullable: true;
            };
            developer: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            issuer: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    BundleDeviceSupport: {
        Name: "BundleDeviceSupport";
        Shape: BundleDeviceSupport;
        Include: Prisma.BundleDeviceSupportInclude;
        Select: Prisma.BundleDeviceSupportSelect;
        OrderBy: Prisma.BundleDeviceSupportOrderByWithRelationInput;
        WhereUnique: Prisma.BundleDeviceSupportWhereUniqueInput;
        Where: Prisma.BundleDeviceSupportWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleExternalIntegrations: {
        Name: "BundleExternalIntegrations";
        Shape: BundleExternalIntegrations;
        Include: Prisma.BundleExternalIntegrationsInclude;
        Select: Prisma.BundleExternalIntegrationsSelect;
        OrderBy: Prisma.BundleExternalIntegrationsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleExternalIntegrationsWhereUniqueInput;
        Where: Prisma.BundleExternalIntegrationsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleFeaturedSlots: {
        Name: "BundleFeaturedSlots";
        Shape: BundleFeaturedSlots;
        Include: Prisma.BundleFeaturedSlotsInclude;
        Select: Prisma.BundleFeaturedSlotsSelect;
        OrderBy: Prisma.BundleFeaturedSlotsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleFeaturedSlotsWhereUniqueInput;
        Where: Prisma.BundleFeaturedSlotsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleInAppPurchases: {
        Name: "BundleInAppPurchases";
        Shape: BundleInAppPurchases;
        Include: Prisma.BundleInAppPurchasesInclude;
        Select: Prisma.BundleInAppPurchasesSelect;
        OrderBy: Prisma.BundleInAppPurchasesOrderByWithRelationInput;
        WhereUnique: Prisma.BundleInAppPurchasesWhereUniqueInput;
        Where: Prisma.BundleInAppPurchasesWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleInstallEvents: {
        Name: "BundleInstallEvents";
        Shape: BundleInstallEvents;
        Include: Prisma.BundleInstallEventsInclude;
        Select: Prisma.BundleInstallEventsSelect;
        OrderBy: Prisma.BundleInstallEventsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleInstallEventsWhereUniqueInput;
        Where: Prisma.BundleInstallEventsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    BundleLanguages: {
        Name: "BundleLanguages";
        Shape: BundleLanguages;
        Include: Prisma.BundleLanguagesInclude;
        Select: Prisma.BundleLanguagesSelect;
        OrderBy: Prisma.BundleLanguagesOrderByWithRelationInput;
        WhereUnique: Prisma.BundleLanguagesWhereUniqueInput;
        Where: Prisma.BundleLanguagesWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleLocalizations: {
        Name: "BundleLocalizations";
        Shape: BundleLocalizations;
        Include: Prisma.BundleLocalizationsInclude;
        Select: Prisma.BundleLocalizationsSelect;
        OrderBy: Prisma.BundleLocalizationsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleLocalizationsWhereUniqueInput;
        Where: Prisma.BundleLocalizationsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleMonetizationConfigs: {
        Name: "BundleMonetizationConfigs";
        Shape: BundleMonetizationConfigs;
        Include: Prisma.BundleMonetizationConfigsInclude;
        Select: Prisma.BundleMonetizationConfigsSelect;
        OrderBy: Prisma.BundleMonetizationConfigsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleMonetizationConfigsWhereUniqueInput;
        Where: Prisma.BundleMonetizationConfigsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleOrders: {
        Name: "BundleOrders";
        Shape: BundleOrders;
        Include: Prisma.BundleOrdersInclude;
        Select: Prisma.BundleOrdersSelect;
        OrderBy: Prisma.BundleOrdersOrderByWithRelationInput;
        WhereUnique: Prisma.BundleOrdersWhereUniqueInput;
        Where: Prisma.BundleOrdersWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "user" | "orderItems" | "paymentLogs" | "refundRequests" | "userEntitlements";
        ListRelations: "orderItems" | "paymentLogs" | "refundRequests" | "userEntitlements";
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            orderItems: {
                Shape: BundleOrderItems[];
                Name: "BundleOrderItems";
                Nullable: false;
            };
            paymentLogs: {
                Shape: BundlePaymentLogs[];
                Name: "BundlePaymentLogs";
                Nullable: false;
            };
            refundRequests: {
                Shape: BundleRefundRequests[];
                Name: "BundleRefundRequests";
                Nullable: false;
            };
            userEntitlements: {
                Shape: BundleUserEntitlements[];
                Name: "BundleUserEntitlements";
                Nullable: false;
            };
        };
    };
    BundlePermissions: {
        Name: "BundlePermissions";
        Shape: BundlePermissions;
        Include: Prisma.BundlePermissionsInclude;
        Select: Prisma.BundlePermissionsSelect;
        OrderBy: Prisma.BundlePermissionsOrderByWithRelationInput;
        WhereUnique: Prisma.BundlePermissionsWhereUniqueInput;
        Where: Prisma.BundlePermissionsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundlePrivacyDeclarations: {
        Name: "BundlePrivacyDeclarations";
        Shape: BundlePrivacyDeclarations;
        Include: Prisma.BundlePrivacyDeclarationsInclude;
        Select: Prisma.BundlePrivacyDeclarationsSelect;
        OrderBy: Prisma.BundlePrivacyDeclarationsOrderByWithRelationInput;
        WhereUnique: Prisma.BundlePrivacyDeclarationsWhereUniqueInput;
        Where: Prisma.BundlePrivacyDeclarationsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundlePromotions: {
        Name: "BundlePromotions";
        Shape: BundlePromotions;
        Include: Prisma.BundlePromotionsInclude;
        Select: Prisma.BundlePromotionsSelect;
        OrderBy: Prisma.BundlePromotionsOrderByWithRelationInput;
        WhereUnique: Prisma.BundlePromotionsWhereUniqueInput;
        Where: Prisma.BundlePromotionsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleRankingScores: {
        Name: "BundleRankingScores";
        Shape: BundleRankingScores;
        Include: Prisma.BundleRankingScoresInclude;
        Select: Prisma.BundleRankingScoresSelect;
        OrderBy: Prisma.BundleRankingScoresOrderByWithRelationInput;
        WhereUnique: Prisma.BundleRankingScoresWhereUniqueInput;
        Where: Prisma.BundleRankingScoresWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleReleaseTracks: {
        Name: "BundleReleaseTracks";
        Shape: BundleReleaseTracks;
        Include: Prisma.BundleReleaseTracksInclude;
        Select: Prisma.BundleReleaseTracksSelect;
        OrderBy: Prisma.BundleReleaseTracksOrderByWithRelationInput;
        WhereUnique: Prisma.BundleReleaseTracksWhereUniqueInput;
        Where: Prisma.BundleReleaseTracksWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "rollouts";
        ListRelations: "rollouts";
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            rollouts: {
                Shape: BundleRollouts[];
                Name: "BundleRollouts";
                Nullable: false;
            };
        };
    };
    BundleRetentionStats: {
        Name: "BundleRetentionStats";
        Shape: BundleRetentionStats;
        Include: Prisma.BundleRetentionStatsInclude;
        Select: Prisma.BundleRetentionStatsSelect;
        OrderBy: Prisma.BundleRetentionStatsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleRetentionStatsWhereUniqueInput;
        Where: Prisma.BundleRetentionStatsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleReviews: {
        Name: "BundleReviews";
        Shape: BundleReviews;
        Include: Prisma.BundleReviewsInclude;
        Select: Prisma.BundleReviewsSelect;
        OrderBy: Prisma.BundleReviewsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleReviewsWhereUniqueInput;
        Where: Prisma.BundleReviewsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "user" | "reviewReports";
        ListRelations: "reviewReports";
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            reviewReports: {
                Shape: BundleReviewReports[];
                Name: "BundleReviewReports";
                Nullable: false;
            };
        };
    };
    BundleRuntimeConfig: {
        Name: "BundleRuntimeConfig";
        Shape: BundleRuntimeConfig;
        Include: Prisma.BundleRuntimeConfigInclude;
        Select: Prisma.BundleRuntimeConfigSelect;
        OrderBy: Prisma.BundleRuntimeConfigOrderByWithRelationInput;
        WhereUnique: Prisma.BundleRuntimeConfigWhereUniqueInput;
        Where: Prisma.BundleRuntimeConfigWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleScreenshots: {
        Name: "BundleScreenshots";
        Shape: BundleScreenshots;
        Include: Prisma.BundleScreenshotsInclude;
        Select: Prisma.BundleScreenshotsSelect;
        OrderBy: Prisma.BundleScreenshotsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleScreenshotsWhereUniqueInput;
        Where: Prisma.BundleScreenshotsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleSearchKeywords: {
        Name: "BundleSearchKeywords";
        Shape: BundleSearchKeywords;
        Include: Prisma.BundleSearchKeywordsInclude;
        Select: Prisma.BundleSearchKeywordsSelect;
        OrderBy: Prisma.BundleSearchKeywordsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleSearchKeywordsWhereUniqueInput;
        Where: Prisma.BundleSearchKeywordsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleStateTransitions: {
        Name: "BundleStateTransitions";
        Shape: BundleStateTransitions;
        Include: Prisma.BundleStateTransitionsInclude;
        Select: Prisma.BundleStateTransitionsSelect;
        OrderBy: Prisma.BundleStateTransitionsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleStateTransitionsWhereUniqueInput;
        Where: Prisma.BundleStateTransitionsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            user: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    BundleStats: {
        Name: "BundleStats";
        Shape: BundleStats;
        Include: Prisma.BundleStatsInclude;
        Select: Prisma.BundleStatsSelect;
        OrderBy: Prisma.BundleStatsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleStatsWhereUniqueInput;
        Where: Prisma.BundleStatsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleStoreFlags: {
        Name: "BundleStoreFlags";
        Shape: BundleStoreFlags;
        Include: Prisma.BundleStoreFlagsInclude;
        Select: Prisma.BundleStoreFlagsSelect;
        OrderBy: Prisma.BundleStoreFlagsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleStoreFlagsWhereUniqueInput;
        Where: Prisma.BundleStoreFlagsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleStoreListings: {
        Name: "BundleStoreListings";
        Shape: BundleStoreListings;
        Include: Prisma.BundleStoreListingsInclude;
        Select: Prisma.BundleStoreListingsSelect;
        OrderBy: Prisma.BundleStoreListingsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleStoreListingsWhereUniqueInput;
        Where: Prisma.BundleStoreListingsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleSubscriptionPlans: {
        Name: "BundleSubscriptionPlans";
        Shape: BundleSubscriptionPlans;
        Include: Prisma.BundleSubscriptionPlansInclude;
        Select: Prisma.BundleSubscriptionPlansSelect;
        OrderBy: Prisma.BundleSubscriptionPlansOrderByWithRelationInput;
        WhereUnique: Prisma.BundleSubscriptionPlansWhereUniqueInput;
        Where: Prisma.BundleSubscriptionPlansWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "subscriptions";
        ListRelations: "subscriptions";
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            subscriptions: {
                Shape: BundleSubscriptionHistory[];
                Name: "BundleSubscriptionHistory";
                Nullable: false;
            };
        };
    };
    BundleTags: {
        Name: "BundleTags";
        Shape: BundleTags;
        Include: Prisma.BundleTagsInclude;
        Select: Prisma.BundleTagsSelect;
        OrderBy: Prisma.BundleTagsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleTagsWhereUniqueInput;
        Where: Prisma.BundleTagsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleTrendingSnapshots: {
        Name: "BundleTrendingSnapshots";
        Shape: BundleTrendingSnapshots;
        Include: Prisma.BundleTrendingSnapshotsInclude;
        Select: Prisma.BundleTrendingSnapshotsSelect;
        OrderBy: Prisma.BundleTrendingSnapshotsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleTrendingSnapshotsWhereUniqueInput;
        Where: Prisma.BundleTrendingSnapshotsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleUserReports: {
        Name: "BundleUserReports";
        Shape: BundleUserReports;
        Include: Prisma.BundleUserReportsInclude;
        Select: Prisma.BundleUserReportsSelect;
        OrderBy: Prisma.BundleUserReportsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleUserReportsWhereUniqueInput;
        Where: Prisma.BundleUserReportsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "reporter" | "reviewer";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            reporter: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            reviewer: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    BundleVersionHistory: {
        Name: "BundleVersionHistory";
        Shape: BundleVersionHistory;
        Include: Prisma.BundleVersionHistoryInclude;
        Select: Prisma.BundleVersionHistorySelect;
        OrderBy: Prisma.BundleVersionHistoryOrderByWithRelationInput;
        WhereUnique: Prisma.BundleVersionHistoryWhereUniqueInput;
        Where: Prisma.BundleVersionHistoryWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "crashReports" | "reviewHistory" | "reviewQueue" | "securityScanResults" | "updatePhases";
        ListRelations: "crashReports" | "reviewHistory" | "reviewQueue" | "securityScanResults" | "updatePhases";
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            crashReports: {
                Shape: BundleCrashReports[];
                Name: "BundleCrashReports";
                Nullable: false;
            };
            reviewHistory: {
                Shape: BundleReviewHistory[];
                Name: "BundleReviewHistory";
                Nullable: false;
            };
            reviewQueue: {
                Shape: BundleReviewQueue[];
                Name: "BundleReviewQueue";
                Nullable: false;
            };
            securityScanResults: {
                Shape: BundleSecurityScanResults[];
                Name: "BundleSecurityScanResults";
                Nullable: false;
            };
            updatePhases: {
                Shape: BundleUpdatePhases[];
                Name: "BundleUpdatePhases";
                Nullable: false;
            };
        };
    };
    BundleWebhooks: {
        Name: "BundleWebhooks";
        Shape: BundleWebhooks;
        Include: Prisma.BundleWebhooksInclude;
        Select: Prisma.BundleWebhooksSelect;
        OrderBy: Prisma.BundleWebhooksOrderByWithRelationInput;
        WhereUnique: Prisma.BundleWebhooksWhereUniqueInput;
        Where: Prisma.BundleWebhooksWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
        };
    };
    BundleOrderItems: {
        Name: "BundleOrderItems";
        Shape: BundleOrderItems;
        Include: Prisma.BundleOrderItemsInclude;
        Select: Prisma.BundleOrderItemsSelect;
        OrderBy: Prisma.BundleOrderItemsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleOrderItemsWhereUniqueInput;
        Where: Prisma.BundleOrderItemsWhereInput;
        Create: {};
        Update: {};
        RelationName: "order";
        ListRelations: never;
        Relations: {
            order: {
                Shape: BundleOrders;
                Name: "BundleOrders";
                Nullable: false;
            };
        };
    };
    BundlePaymentLogs: {
        Name: "BundlePaymentLogs";
        Shape: BundlePaymentLogs;
        Include: Prisma.BundlePaymentLogsInclude;
        Select: Prisma.BundlePaymentLogsSelect;
        OrderBy: Prisma.BundlePaymentLogsOrderByWithRelationInput;
        WhereUnique: Prisma.BundlePaymentLogsWhereUniqueInput;
        Where: Prisma.BundlePaymentLogsWhereInput;
        Create: {};
        Update: {};
        RelationName: "order";
        ListRelations: never;
        Relations: {
            order: {
                Shape: BundleOrders;
                Name: "BundleOrders";
                Nullable: false;
            };
        };
    };
    BundleRefundRequests: {
        Name: "BundleRefundRequests";
        Shape: BundleRefundRequests;
        Include: Prisma.BundleRefundRequestsInclude;
        Select: Prisma.BundleRefundRequestsSelect;
        OrderBy: Prisma.BundleRefundRequestsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleRefundRequestsWhereUniqueInput;
        Where: Prisma.BundleRefundRequestsWhereInput;
        Create: {};
        Update: {};
        RelationName: "order" | "reviewer" | "user";
        ListRelations: never;
        Relations: {
            order: {
                Shape: BundleOrders;
                Name: "BundleOrders";
                Nullable: false;
            };
            reviewer: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    BundleUserEntitlements: {
        Name: "BundleUserEntitlements";
        Shape: BundleUserEntitlements;
        Include: Prisma.BundleUserEntitlementsInclude;
        Select: Prisma.BundleUserEntitlementsSelect;
        OrderBy: Prisma.BundleUserEntitlementsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleUserEntitlementsWhereUniqueInput;
        Where: Prisma.BundleUserEntitlementsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "order" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            order: {
                Shape: BundleOrders | null;
                Name: "BundleOrders";
                Nullable: true;
            };
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    BundleRollouts: {
        Name: "BundleRollouts";
        Shape: BundleRollouts;
        Include: Prisma.BundleRolloutsInclude;
        Select: Prisma.BundleRolloutsSelect;
        OrderBy: Prisma.BundleRolloutsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleRolloutsWhereUniqueInput;
        Where: Prisma.BundleRolloutsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "track";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            track: {
                Shape: BundleReleaseTracks;
                Name: "BundleReleaseTracks";
                Nullable: false;
            };
        };
    };
    BundleReviewReports: {
        Name: "BundleReviewReports";
        Shape: BundleReviewReports;
        Include: Prisma.BundleReviewReportsInclude;
        Select: Prisma.BundleReviewReportsSelect;
        OrderBy: Prisma.BundleReviewReportsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleReviewReportsWhereUniqueInput;
        Where: Prisma.BundleReviewReportsWhereInput;
        Create: {};
        Update: {};
        RelationName: "reporter" | "review" | "reviewer";
        ListRelations: never;
        Relations: {
            reporter: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            review: {
                Shape: BundleReviews;
                Name: "BundleReviews";
                Nullable: false;
            };
            reviewer: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    BundleSubscriptionHistory: {
        Name: "BundleSubscriptionHistory";
        Shape: BundleSubscriptionHistory;
        Include: Prisma.BundleSubscriptionHistoryInclude;
        Select: Prisma.BundleSubscriptionHistorySelect;
        OrderBy: Prisma.BundleSubscriptionHistoryOrderByWithRelationInput;
        WhereUnique: Prisma.BundleSubscriptionHistoryWhereUniqueInput;
        Where: Prisma.BundleSubscriptionHistoryWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "plan" | "user";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            plan: {
                Shape: BundleSubscriptionPlans;
                Name: "BundleSubscriptionPlans";
                Nullable: false;
            };
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    BundleCrashReports: {
        Name: "BundleCrashReports";
        Shape: BundleCrashReports;
        Include: Prisma.BundleCrashReportsInclude;
        Select: Prisma.BundleCrashReportsSelect;
        OrderBy: Prisma.BundleCrashReportsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleCrashReportsWhereUniqueInput;
        Where: Prisma.BundleCrashReportsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "version";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            version: {
                Shape: BundleVersionHistory | null;
                Name: "BundleVersionHistory";
                Nullable: true;
            };
        };
    };
    BundleReviewHistory: {
        Name: "BundleReviewHistory";
        Shape: BundleReviewHistory;
        Include: Prisma.BundleReviewHistoryInclude;
        Select: Prisma.BundleReviewHistorySelect;
        OrderBy: Prisma.BundleReviewHistoryOrderByWithRelationInput;
        WhereUnique: Prisma.BundleReviewHistoryWhereUniqueInput;
        Where: Prisma.BundleReviewHistoryWhereInput;
        Create: {};
        Update: {};
        RelationName: "actor" | "bundle" | "version";
        ListRelations: never;
        Relations: {
            actor: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            version: {
                Shape: BundleVersionHistory | null;
                Name: "BundleVersionHistory";
                Nullable: true;
            };
        };
    };
    BundleReviewQueue: {
        Name: "BundleReviewQueue";
        Shape: BundleReviewQueue;
        Include: Prisma.BundleReviewQueueInclude;
        Select: Prisma.BundleReviewQueueSelect;
        OrderBy: Prisma.BundleReviewQueueOrderByWithRelationInput;
        WhereUnique: Prisma.BundleReviewQueueWhereUniqueInput;
        Where: Prisma.BundleReviewQueueWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "reviewer" | "submittedVersion";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            reviewer: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
            submittedVersion: {
                Shape: BundleVersionHistory | null;
                Name: "BundleVersionHistory";
                Nullable: true;
            };
        };
    };
    BundleSecurityScanResults: {
        Name: "BundleSecurityScanResults";
        Shape: BundleSecurityScanResults;
        Include: Prisma.BundleSecurityScanResultsInclude;
        Select: Prisma.BundleSecurityScanResultsSelect;
        OrderBy: Prisma.BundleSecurityScanResultsOrderByWithRelationInput;
        WhereUnique: Prisma.BundleSecurityScanResultsWhereUniqueInput;
        Where: Prisma.BundleSecurityScanResultsWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "version";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            version: {
                Shape: BundleVersionHistory | null;
                Name: "BundleVersionHistory";
                Nullable: true;
            };
        };
    };
    BundleUpdatePhases: {
        Name: "BundleUpdatePhases";
        Shape: BundleUpdatePhases;
        Include: Prisma.BundleUpdatePhasesInclude;
        Select: Prisma.BundleUpdatePhasesSelect;
        OrderBy: Prisma.BundleUpdatePhasesOrderByWithRelationInput;
        WhereUnique: Prisma.BundleUpdatePhasesWhereUniqueInput;
        Where: Prisma.BundleUpdatePhasesWhereInput;
        Create: {};
        Update: {};
        RelationName: "bundle" | "version";
        ListRelations: never;
        Relations: {
            bundle: {
                Shape: Bundles;
                Name: "Bundles";
                Nullable: false;
            };
            version: {
                Shape: BundleVersionHistory;
                Name: "BundleVersionHistory";
                Nullable: false;
            };
        };
    };
}
export function getDatamodel(): PothosPrismaDatamodel { return JSON.parse("{\"datamodel\":{\"models\":{\"Order\":{\"fields\":[{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"orderId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"symbol\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"side\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"orderType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"quantity\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"price\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"submittedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"RiskEvent\":{\"fields\":[{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"eventType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"severity\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"message\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Json\",\"kind\":\"scalar\",\"name\":\"metadata\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"occurredAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"File\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"path\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bucket\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"size\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"contentType\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"filename\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"mimetype\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"usersWithPhoto\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"UserPhoto\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"User\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"email\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"password\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"provider\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"socialId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"firstName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"lastName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"fullName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"phone\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"dateOfBirth\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"gender\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"photoId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"registerType\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"deletedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"File\",\"kind\":\"object\",\"name\":\"photo\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"UserPhoto\",\"relationFromFields\":[\"photoId\"],\"isUpdatedAt\":false},{\"type\":\"BundlePayouts\",\"kind\":\"object\",\"name\":\"payouts\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlePayoutsToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundles\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlesToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Notifications\",\"kind\":\"object\",\"name\":\"notificationsActor\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"NotificationActor\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Notifications\",\"kind\":\"object\",\"name\":\"notificationsRecipient\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"NotificationRecipient\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Session\",\"kind\":\"object\",\"name\":\"sessions\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"SessionToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"UserDeviceToken\",\"kind\":\"object\",\"name\":\"deviceTokens\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"UserToUserDeviceToken\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleAnalyticsEvents\",\"kind\":\"object\",\"name\":\"analytics\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAnalyticsEventsToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleAuditLog\",\"kind\":\"object\",\"name\":\"auditLogs\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAuditLogToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleBetaTesters\",\"kind\":\"object\",\"name\":\"betaTesters\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleBetaTestersToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleChangeLogs\",\"kind\":\"object\",\"name\":\"changedLogs\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleChangeLogsToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleCollaborators\",\"kind\":\"object\",\"name\":\"collaboratorsInvited\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CollaboratorInvitedBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleCollaborators\",\"kind\":\"object\",\"name\":\"collaborators\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CollaboratorUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleDeveloperStrikes\",\"kind\":\"object\",\"name\":\"developerStrikes\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"StrikeDeveloper\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleDeveloperStrikes\",\"kind\":\"object\",\"name\":\"developerStrikesIssued\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"StrikeIssuedBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleInstallEvents\",\"kind\":\"object\",\"name\":\"installEvents\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleInstallEventsToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleOrders\",\"kind\":\"object\",\"name\":\"orders\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviews\",\"kind\":\"object\",\"name\":\"reviews\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewsToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleStateTransitions\",\"kind\":\"object\",\"name\":\"stateTransitions\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStateTransitionsToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleUserReports\",\"kind\":\"object\",\"name\":\"userReportsReported\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReportReportedBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleUserReports\",\"kind\":\"object\",\"name\":\"userReportsReviewed\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReportReviewedBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleRefundRequests\",\"kind\":\"object\",\"name\":\"refundRequestsReviewed\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"RefundReviewedBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleRefundRequests\",\"kind\":\"object\",\"name\":\"refundRequests\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"RefundUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleUserEntitlements\",\"kind\":\"object\",\"name\":\"userEntitlements\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUserEntitlementsToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviewReports\",\"kind\":\"object\",\"name\":\"reviewReportsReported\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReviewReportReportedBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviewReports\",\"kind\":\"object\",\"name\":\"reviewReportsReviewed\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReviewReportReviewedBy\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleSubscriptionHistory\",\"kind\":\"object\",\"name\":\"subscriptionHistory\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSubscriptionHistoryToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviewHistory\",\"kind\":\"object\",\"name\":\"reviewHistory\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewHistoryToUser\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviewQueue\",\"kind\":\"object\",\"name\":\"reviewQueueReviewed\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReviewQueueReviewer\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundlePayouts\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"developerId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"amount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"currency\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"periodStart\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"periodEnd\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bankAccount\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"transactionRef\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"developer\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlePayoutsToUser\",\"relationFromFields\":[\"developerId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"Bundles\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleKey\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"name\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"slug\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"version\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"buildNumber\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"iconUrl\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bannerUrl\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"shortDescription\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"description\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"privacyPolicyUrl\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"supportUrl\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"websiteUrl\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"developerName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"developerId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"developerEmail\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"category\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"subCategory\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"storagePath\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bucket\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"fileSize\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"checksum\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"price\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"currency\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isFree\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isOneTimePayment\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"hasInAppPurchases\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"hasSubscription\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"rejectionReason\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"publishedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"expiresAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"changelog\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"releaseNotes\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"ageRating\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"contentAdvisory\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"deletedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"developer\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlesToUser\",\"relationFromFields\":[\"developerId\"],\"isUpdatedAt\":false},{\"type\":\"BundleAbTests\",\"kind\":\"object\",\"name\":\"abTests\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAbTestsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleAbuseSignals\",\"kind\":\"object\",\"name\":\"abuseSignals\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAbuseSignalsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleAdConfigurations\",\"kind\":\"object\",\"name\":\"adConfigurations\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAdConfigurationsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleAnalyticsEvents\",\"kind\":\"object\",\"name\":\"analyticsEvents\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAnalyticsEventsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleApiUsageStats\",\"kind\":\"object\",\"name\":\"apiUsageStats\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleApiUsageStatsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleAuditLog\",\"kind\":\"object\",\"name\":\"auditLogs\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAuditLogToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleBetaTesters\",\"kind\":\"object\",\"name\":\"betaTesters\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleBetaTestersToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleChangeLogs\",\"kind\":\"object\",\"name\":\"changeLogs\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleChangeLogsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleCollaborators\",\"kind\":\"object\",\"name\":\"collaborators\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleCollaboratorsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleContentRatings\",\"kind\":\"object\",\"name\":\"contentRatings\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleContentRatingsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleCountries\",\"kind\":\"object\",\"name\":\"countries\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleCountriesToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleDependencies\",\"kind\":\"object\",\"name\":\"dependencies\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSource\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleDependencies\",\"kind\":\"object\",\"name\":\"dependentBundles\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleDependency\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleDeveloperStrikes\",\"kind\":\"object\",\"name\":\"developerStrikes\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleDeveloperStrikesToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleDeviceSupport\",\"kind\":\"object\",\"name\":\"deviceSupports\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleDeviceSupportToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleExternalIntegrations\",\"kind\":\"object\",\"name\":\"externalIntegrations\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleExternalIntegrationsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleFeaturedSlots\",\"kind\":\"object\",\"name\":\"featuredSlots\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleFeaturedSlotsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleInAppPurchases\",\"kind\":\"object\",\"name\":\"inAppPurchases\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleInAppPurchasesToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleInstallEvents\",\"kind\":\"object\",\"name\":\"installEvents\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleInstallEventsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleLanguages\",\"kind\":\"object\",\"name\":\"languages\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleLanguagesToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleLocalizations\",\"kind\":\"object\",\"name\":\"localizations\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleLocalizationsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleMonetizationConfigs\",\"kind\":\"object\",\"name\":\"monetizationConfigs\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleMonetizationConfigsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleOrders\",\"kind\":\"object\",\"name\":\"orders\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundlePermissions\",\"kind\":\"object\",\"name\":\"permissions\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlePermissionsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundlePrivacyDeclarations\",\"kind\":\"object\",\"name\":\"privacyDeclarations\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlePrivacyDeclarationsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundlePromotions\",\"kind\":\"object\",\"name\":\"promotions\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlePromotionsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleRankingScores\",\"kind\":\"object\",\"name\":\"rankingScores\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleRankingScoresToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReleaseTracks\",\"kind\":\"object\",\"name\":\"releaseTracks\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReleaseTracksToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleRetentionStats\",\"kind\":\"object\",\"name\":\"retentionStats\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleRetentionStatsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviews\",\"kind\":\"object\",\"name\":\"reviews\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleRuntimeConfig\",\"kind\":\"object\",\"name\":\"runtimeConfig\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleRuntimeConfigToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleScreenshots\",\"kind\":\"object\",\"name\":\"screenshots\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleScreenshotsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleSearchKeywords\",\"kind\":\"object\",\"name\":\"searchKeywords\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSearchKeywordsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleStateTransitions\",\"kind\":\"object\",\"name\":\"stateTransitions\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStateTransitionsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleStats\",\"kind\":\"object\",\"name\":\"stats\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStatsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleStoreFlags\",\"kind\":\"object\",\"name\":\"storeFlags\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStoreFlagsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleStoreListings\",\"kind\":\"object\",\"name\":\"storeListings\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStoreListingsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleSubscriptionPlans\",\"kind\":\"object\",\"name\":\"subscriptionPlans\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSubscriptionPlansToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleTags\",\"kind\":\"object\",\"name\":\"tags\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleTagsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleTrendingSnapshots\",\"kind\":\"object\",\"name\":\"trendingSnapshots\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleTrendingSnapshotsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleUserReports\",\"kind\":\"object\",\"name\":\"userReports\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUserReportsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleVersionHistory\",\"kind\":\"object\",\"name\":\"versionHistories\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleVersionHistoryToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleWebhooks\",\"kind\":\"object\",\"name\":\"webhooks\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleWebhooksToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleUserEntitlements\",\"kind\":\"object\",\"name\":\"userEntitlements\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUserEntitlementsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleRollouts\",\"kind\":\"object\",\"name\":\"rollouts\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleRolloutsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleSubscriptionHistory\",\"kind\":\"object\",\"name\":\"subscriptionHistory\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSubscriptionHistoryToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleCrashReports\",\"kind\":\"object\",\"name\":\"crashReports\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleCrashReportsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviewHistory\",\"kind\":\"object\",\"name\":\"reviewHistory\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewHistoryToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviewQueue\",\"kind\":\"object\",\"name\":\"reviewQueue\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewQueueToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleSecurityScanResults\",\"kind\":\"object\",\"name\":\"securityScanResults\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSecurityScanResultsToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleUpdatePhases\",\"kind\":\"object\",\"name\":\"updatePhases\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUpdatePhasesToBundles\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"Notifications\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"title\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"body\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"type\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isRead\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"readAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"recipientId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"actorId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"resourceId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"resourceType\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"metadata\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"deletedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"actor\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"NotificationActor\",\"relationFromFields\":[\"actorId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"recipient\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"NotificationRecipient\",\"relationFromFields\":[\"recipientId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"Session\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"hash\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"deletedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"SessionToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"UserDeviceToken\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"fcmToken\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"platform\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"deviceModel\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"osVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"UserToUserDeviceToken\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleAbTests\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"testName\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"hypothesis\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"variantAConfig\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"variantBConfig\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"metric\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"trafficSplit\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"winnerVariant\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"startedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"endedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAbTestsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleAbuseSignals\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"fakeReviewScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"suspiciousInstallRate\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"anomalyScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"clickFarmScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"ratingManipulationScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"overallRiskScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"riskLevel\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"lastCalculatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"flaggedForReview\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAbuseSignalsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleAdConfigurations\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"provider\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"appId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bannerId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"interstitialId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"rewardedId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"nativeId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isTestMode\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAdConfigurationsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleAnalyticsEvents\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"sessionId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"eventType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"eventData\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"platformVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"ipAddress\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAnalyticsEventsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAnalyticsEventsToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleApiUsageStats\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"statsDate\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"endpoint\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"method\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"callCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"errorCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"avgLatencyMs\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"p99LatencyMs\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleApiUsageStatsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleAuditLog\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"action\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"fieldName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"oldValue\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"countryCode\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAuditLogToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleAuditLogToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleBetaTesters\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"email\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"inviteCode\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"expiresAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleBetaTestersToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleBetaTestersToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"email\"]}]},\"BundleChangeLogs\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"entityType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"entityId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"changeType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"diff\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"changedBy\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleChangeLogsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleChangeLogsToUser\",\"relationFromFields\":[\"changedBy\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleCollaborators\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"role\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"invitedBy\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"acceptedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleCollaboratorsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"invitedUser\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CollaboratorInvitedBy\",\"relationFromFields\":[\"invitedBy\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CollaboratorUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"userId\"]}]},\"BundleContentRatings\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"ratingBoard\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"rating\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"descriptors\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleContentRatingsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"ratingBoard\"]}]},\"BundleCountries\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"countryCode\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isAvailable\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"priceOverride\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"currency\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleCountriesToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"countryCode\"]}]},\"BundleDependencies\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"dependencyBundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"dependencyBundleKey\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"minVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"maxVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isOptional\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSource\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"dependencyBundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleDependency\",\"relationFromFields\":[\"dependencyBundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"dependencyBundleId\"]}]},\"BundleDeveloperStrikes\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"developerId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"strikeType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"severity\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"description\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"issuedBy\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"expiresAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleDeveloperStrikesToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"developer\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"StrikeDeveloper\",\"relationFromFields\":[\"developerId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"issuer\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"StrikeIssuedBy\",\"relationFromFields\":[\"issuedBy\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleDeviceSupport\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"deviceModel\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"platform\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"minOs\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"maxOs\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isSupported\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"notes\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleDeviceSupportToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"deviceModel\",\"platform\"]}]},\"BundleExternalIntegrations\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"integrationType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"displayName\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"config\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"lastSyncAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleExternalIntegrationsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"integrationType\"]}]},\"BundleFeaturedSlots\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"slotType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"title\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"subtitle\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bannerUrl\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"ctaLabel\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"region\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"sortOrder\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"startsAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"endsAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleFeaturedSlotsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleInAppPurchases\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"productId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"name\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"description\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"price\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"currency\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"purchaseType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleInAppPurchasesToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"productId\"]}]},\"BundleInstallEvents\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"eventType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"deviceId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"platform\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"osVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"countryCode\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleInstallEventsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleInstallEventsToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleLanguages\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"languageCode\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"languageName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleLanguagesToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"languageCode\"]}]},\"BundleLocalizations\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"languageCode\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"localizedName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"localizedShortDesc\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"localizedDescription\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"localizedChangelog\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleLocalizationsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"languageCode\"]}]},\"BundleMonetizationConfigs\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"monetizationType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"defaultPriceTier\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"revenueSharePercent\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"trialPeriodDays\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"adsEnabled\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"adsProvider\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"crossSellEnabled\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleMonetizationConfigsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleOrders\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"totalAmount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"currency\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"paymentProvider\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"transactionRef\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"notes\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false},{\"type\":\"BundleOrderItems\",\"kind\":\"object\",\"name\":\"orderItems\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrderItemsToBundleOrders\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundlePaymentLogs\",\"kind\":\"object\",\"name\":\"paymentLogs\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToBundlePaymentLogs\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleRefundRequests\",\"kind\":\"object\",\"name\":\"refundRequests\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToBundleRefundRequests\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleUserEntitlements\",\"kind\":\"object\",\"name\":\"userEntitlements\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToBundleUserEntitlements\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundlePermissions\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"permissionKey\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"permissionLabel\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isRequired\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"rationale\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlePermissionsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"permissionKey\"]}]},\"BundlePrivacyDeclarations\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"collectsPersonalData\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"dataTypes\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"purposeOfCollection\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"thirdPartySharing\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"thirdParties\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"dataRetentionDays\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"privacyContactEmail\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlePrivacyDeclarationsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundlePromotions\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"promoCode\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"promoType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"discountValue\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"maxRedemptions\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"currentRedemptions\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"minOrderAmount\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"startsAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"endsAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundlePromotionsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleRankingScores\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"popularityScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"retentionScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"qualityScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"crashScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"overallScore\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleRankingScoresToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleReleaseTracks\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"track\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"version\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"buildNumber\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"storagePath\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"releaseNotes\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReleaseTracksToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleRollouts\",\"kind\":\"object\",\"name\":\"rollouts\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReleaseTracksToBundleRollouts\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"track\",\"version\"]}]},\"BundleRetentionStats\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"statsDate\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"d1Retention\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"d7Retention\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"d30Retention\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"dau\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"mau\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"sessionCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"avgSessionDuration\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleRetentionStatsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"statsDate\"]}]},\"BundleReviews\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rating\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"title\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"body\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isVerified\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"developerReply\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"helpfulCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"reportCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewsToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false},{\"type\":\"BundleReviewReports\",\"kind\":\"object\",\"name\":\"reviewReports\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewReportsToBundleReviews\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"userId\"]}]},\"BundleRuntimeConfig\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"minOsVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"runtimeType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"targetPlatforms\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"sdkVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"offlineSupported\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleRuntimeConfigToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleScreenshots\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"url\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"caption\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"deviceType\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"sortOrder\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleScreenshotsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleSearchKeywords\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"keyword\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"locale\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"weight\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSearchKeywordsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"keyword\",\"locale\"]}]},\"BundleStateTransitions\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"fromState\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"toState\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"trigger\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"triggeredBy\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"metadata\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStateTransitionsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStateTransitionsToUser\",\"relationFromFields\":[\"triggeredBy\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleStats\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"rating\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"ratingCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rating1\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rating2\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rating3\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rating4\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rating5\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"downloadCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"activeInstalls\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStatsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleStoreFlags\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":true,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isFeatured\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isVerified\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isEditorChoice\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"featuredOrder\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStoreFlagsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleStoreListings\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"region\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"name\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"shortDescription\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"description\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleStoreListingsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"region\"]}]},\"BundleSubscriptionPlans\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"planKey\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"name\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"description\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"price\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"currency\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"billingPeriod\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"trialDays\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSubscriptionPlansToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleSubscriptionHistory\",\"kind\":\"object\",\"name\":\"subscriptions\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSubscriptionHistoryToBundleSubscriptionPlans\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"planKey\"]}]},\"BundleTags\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"tag\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleTagsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"tag\"]}]},\"BundleTrendingSnapshots\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"snapshotDate\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"downloadCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"activeInstalls\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rankPosition\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"category\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleTrendingSnapshotsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"snapshotDate\"]}]},\"BundleUserReports\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reportedBy\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reason\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"description\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"evidenceUrls\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reviewedBy\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"resolution\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUserReportsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"reporter\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReportReportedBy\",\"relationFromFields\":[\"reportedBy\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"reviewer\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReportReviewedBy\",\"relationFromFields\":[\"reviewedBy\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleVersionHistory\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"version\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"buildNumber\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"storagePath\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"fileSize\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"changelog\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"publishedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleVersionHistoryToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleCrashReports\",\"kind\":\"object\",\"name\":\"crashReports\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleCrashReportsToBundleVersionHistory\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviewHistory\",\"kind\":\"object\",\"name\":\"reviewHistory\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewHistoryToBundleVersionHistory\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleReviewQueue\",\"kind\":\"object\",\"name\":\"reviewQueue\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewQueueToBundleVersionHistory\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleSecurityScanResults\",\"kind\":\"object\",\"name\":\"securityScanResults\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSecurityScanResultsToBundleVersionHistory\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"BundleUpdatePhases\",\"kind\":\"object\",\"name\":\"updatePhases\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUpdatePhasesToBundleVersionHistory\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"version\",\"buildNumber\"]}]},\"BundleWebhooks\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"url\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"secret\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"events\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"failureCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"lastTriggeredAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleWebhooksToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleOrderItems\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"orderId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"productType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"productId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"productName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"price\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"currency\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"quantity\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BundleOrders\",\"kind\":\"object\",\"name\":\"order\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrderItemsToBundleOrders\",\"relationFromFields\":[\"orderId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundlePaymentLogs\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"orderId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"provider\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"event\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"rawPayload\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BundleOrders\",\"kind\":\"object\",\"name\":\"order\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToBundlePaymentLogs\",\"relationFromFields\":[\"orderId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleRefundRequests\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"orderId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reason\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"amount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reviewedBy\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reviewNote\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BundleOrders\",\"kind\":\"object\",\"name\":\"order\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToBundleRefundRequests\",\"relationFromFields\":[\"orderId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"reviewer\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"RefundReviewedBy\",\"relationFromFields\":[\"reviewedBy\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"RefundUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleUserEntitlements\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"orderId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"entitlementType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"expiresAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isActive\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUserEntitlementsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleOrders\",\"kind\":\"object\",\"name\":\"order\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleOrdersToBundleUserEntitlements\",\"relationFromFields\":[\"orderId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUserEntitlementsToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"userId\",\"bundleId\",\"entitlementType\"]}]},\"BundleRollouts\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"trackId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rolloutPercent\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"targetCountry\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"startedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"completedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleRolloutsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleReleaseTracks\",\"kind\":\"object\",\"name\":\"track\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReleaseTracksToBundleRollouts\",\"relationFromFields\":[\"trackId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleReviewReports\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reviewId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reportedBy\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reason\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"description\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reviewedBy\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"reporter\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReviewReportReportedBy\",\"relationFromFields\":[\"reportedBy\"],\"isUpdatedAt\":false},{\"type\":\"BundleReviews\",\"kind\":\"object\",\"name\":\"review\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewReportsToBundleReviews\",\"relationFromFields\":[\"reviewId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"reviewer\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReviewReportReviewedBy\",\"relationFromFields\":[\"reviewedBy\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"reviewId\",\"reportedBy\"]}]},\"BundleSubscriptionHistory\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"userId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"planId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"startAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"endAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"cancelReason\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSubscriptionHistoryToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleSubscriptionPlans\",\"kind\":\"object\",\"name\":\"plan\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSubscriptionHistoryToBundleSubscriptionPlans\",\"relationFromFields\":[\"planId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"user\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSubscriptionHistoryToUser\",\"relationFromFields\":[\"userId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleCrashReports\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"versionId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"deviceModel\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"osVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"platform\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"stackTraceHash\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"stackTrace\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"occurrenceCount\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"affectedUsers\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"firstSeen\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"BigInt\",\"kind\":\"scalar\",\"name\":\"lastSeen\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Boolean\",\"kind\":\"scalar\",\"name\":\"isResolved\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleCrashReportsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleVersionHistory\",\"kind\":\"object\",\"name\":\"version\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleCrashReportsToBundleVersionHistory\",\"relationFromFields\":[\"versionId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"bundleId\",\"versionId\",\"stackTraceHash\"]}]},\"BundleReviewHistory\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"versionId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"action\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"actorId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reason\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"metadata\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"actor\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewHistoryToUser\",\"relationFromFields\":[\"actorId\"],\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewHistoryToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleVersionHistory\",\"kind\":\"object\",\"name\":\"version\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewHistoryToBundleVersionHistory\",\"relationFromFields\":[\"versionId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleReviewQueue\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"submittedVersionId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"reviewerId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"priority\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"reviewedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"notes\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"updatedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewQueueToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"User\",\"kind\":\"object\",\"name\":\"reviewer\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReviewQueueReviewer\",\"relationFromFields\":[\"reviewerId\"],\"isUpdatedAt\":false},{\"type\":\"BundleVersionHistory\",\"kind\":\"object\",\"name\":\"submittedVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleReviewQueueToBundleVersionHistory\",\"relationFromFields\":[\"submittedVersionId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleSecurityScanResults\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"versionId\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"scanType\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"result\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"severity\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"findings\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"scannedAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"scannerVersion\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSecurityScanResultsToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleVersionHistory\",\"kind\":\"object\",\"name\":\"version\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleSecurityScanResultsToBundleVersionHistory\",\"relationFromFields\":[\"versionId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"BundleUpdatePhases\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"bundleId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"versionId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"phaseOrder\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"percentage\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"targetCountry\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"startedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"endedAt\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"status\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"createdAt\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Bundles\",\"kind\":\"object\",\"name\":\"bundle\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUpdatePhasesToBundles\",\"relationFromFields\":[\"bundleId\"],\"isUpdatedAt\":false},{\"type\":\"BundleVersionHistory\",\"kind\":\"object\",\"name\":\"version\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"BundleUpdatePhasesToBundleVersionHistory\",\"relationFromFields\":[\"versionId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]}}}}"); }