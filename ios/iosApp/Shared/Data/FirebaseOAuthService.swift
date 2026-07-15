import AuthenticationServices
import CryptoKit
import FirebaseAuth
import FirebaseCore
import GoogleSignIn
import Security
import UIKit

@MainActor
final class FirebaseOAuthService {
    private var currentAppleNonce: String?

    func configureAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = randomNonceString()
        currentAppleNonce = nonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = sha256(nonce)
    }

    func signInWithApple(result: Result<ASAuthorization, Error>) async throws -> String {
        let authorization = try result.get()
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            throw OAuthError.invalidCredential
        }
        guard let nonce = currentAppleNonce else {
            throw OAuthError.missingNonce
        }
        guard let tokenData = credential.identityToken,
              let idToken = String(data: tokenData, encoding: .utf8) else {
            throw OAuthError.missingIDToken
        }

        let firebaseCredential = OAuthProvider.appleCredential(
            withIDToken: idToken,
            rawNonce: nonce,
            fullName: credential.fullName
        )
        let authResult = try await signIn(with: firebaseCredential)
        return try await firebaseIDToken(for: authResult.user)
    }

    func signInWithGoogle() async throws -> String {
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            throw OAuthError.missingGoogleClientID
        }
        guard let presentingViewController = UIApplication.shared.topMostViewController() else {
            throw OAuthError.missingPresenter
        }

        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
        let result = try await googleSignIn(with: presentingViewController)
        guard let idToken = result.user.idToken?.tokenString else {
            throw OAuthError.missingIDToken
        }
        let accessToken = result.user.accessToken.tokenString
        let credential = GoogleAuthProvider.credential(withIDToken: idToken, accessToken: accessToken)
        let authResult = try await signIn(with: credential)
        return try await firebaseIDToken(for: authResult.user)
    }

    private func googleSignIn(with presentingViewController: UIViewController) async throws -> GIDSignInResult {
        try await withCheckedThrowingContinuation { continuation in
            GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController) { result, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let result else {
                    continuation.resume(throwing: OAuthError.invalidCredential)
                    return
                }
                continuation.resume(returning: result)
            }
        }
    }

    private func signIn(with credential: AuthCredential) async throws -> AuthDataResult {
        try await withCheckedThrowingContinuation { continuation in
            Auth.auth().signIn(with: credential) { result, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let result else {
                    continuation.resume(throwing: OAuthError.invalidCredential)
                    return
                }
                continuation.resume(returning: result)
            }
        }
    }

    private func firebaseIDToken(for user: FirebaseAuth.User) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            user.getIDTokenForcingRefresh(true) { token, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let token, !token.isEmpty else {
                    continuation.resume(throwing: OAuthError.missingIDToken)
                    return
                }
                continuation.resume(returning: token)
            }
        }
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        return hashedData.map { String(format: "%02x", $0) }.joined()
    }

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remainingLength = length

        while remainingLength > 0 {
            var randoms = [UInt8](repeating: 0, count: 16)
            let status = SecRandomCopyBytes(kSecRandomDefault, randoms.count, &randoms)
            if status != errSecSuccess {
                fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(status)")
            }

            randoms.forEach { random in
                if remainingLength == 0 {
                    return
                }
                if random < UInt8(charset.count) {
                    result.append(charset[Int(random)])
                    remainingLength -= 1
                }
            }
        }
        return result
    }
}

private enum OAuthError: LocalizedError {
    case invalidCredential
    case missingNonce
    case missingIDToken
    case missingGoogleClientID
    case missingPresenter

    var errorDescription: String? {
        switch self {
        case .invalidCredential:
            return "Unable to read OAuth credential."
        case .missingNonce:
            return "Apple sign-in nonce is missing."
        case .missingIDToken:
            return "Firebase ID token is missing."
        case .missingGoogleClientID:
            return "Google client ID is missing from Firebase configuration."
        case .missingPresenter:
            return "Unable to present Google sign-in."
        }
    }
}

private extension UIApplication {
    func topMostViewController() -> UIViewController? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController?
            .topMostPresentedViewController()
    }
}

private extension UIViewController {
    func topMostPresentedViewController() -> UIViewController {
        if let presentedViewController {
            return presentedViewController.topMostPresentedViewController()
        }
        if let navigationController = self as? UINavigationController,
           let visibleViewController = navigationController.visibleViewController {
            return visibleViewController.topMostPresentedViewController()
        }
        if let tabBarController = self as? UITabBarController,
           let selectedViewController = tabBarController.selectedViewController {
            return selectedViewController.topMostPresentedViewController()
        }
        return self
    }
}
