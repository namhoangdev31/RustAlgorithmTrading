import Foundation
import Contacts

final class ContactsPlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "contacts.get",
            permission: .contacts,
            policy: .protected
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: payload["appId"] as? String ?? "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "ContactsPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }

    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let store = CNContactStore()
        let keysToFetch = [
            CNContactGivenNameKey as CNKeyDescriptor,
            CNContactFamilyNameKey as CNKeyDescriptor,
            CNContactPhoneNumbersKey as CNKeyDescriptor
        ]
        
        let fetchRequest = CNContactFetchRequest(keysToFetch: keysToFetch)
        var contactsList: [[String: Any]] = []
        
        do {
            try store.enumerateContacts(with: fetchRequest) { contact, _ in
                let fullName = "\(contact.givenName) \(contact.familyName)".trimmingCharacters(in: .whitespacesAndNewlines)
                let numbers = contact.phoneNumbers.map { $0.value.stringValue }
                
                if !fullName.isEmpty || !numbers.isEmpty {
                    contactsList.append([
                        "name": fullName,
                        "phone": numbers.first ?? ""
                    ])
                }
            }
            return .success(["contacts": contactsList])
        } catch {
            return .failure(code: "CONTACTS_FETCH_ERROR", message: error.localizedDescription)
        }
    }
}
