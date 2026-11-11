import Foundation
#if canImport(CallKit) && os(iOS)
import CallKit
import AVFoundation

/// Native iOS CallKit Manager supporting:
/// - Random Friend Audio & Video Calls (`hasVideo = true/false`)
/// - Celebrity Audio & Video Calls (`hasVideo = true/false`, metered per minute)
/// - Customer Care Support Calls (`SUPPORT_AUDIO` -> `hasVideo` strictly forced to `false`)
public final class CallKitManager: NSObject, CXProviderDelegate {
    public static let shared = CallKitManager()
    private let provider: CXProvider
    private let callController = CXCallController()

    private override init() {
        let config = CXProviderConfiguration(localizedName: "Friends Connect")
        config.supportsVideo = true
        config.maximumCallsPerCallGroup = 1
        config.supportedHandleTypes = [.phoneNumber, .generic]
        self.provider = CXProvider(configuration: config)
        super.init()
        self.provider.setDelegate(self, queue: nil)
    }

    public func reportIncomingCall(
        uuid: UUID,
        handle: String,
        callType: String,
        completion: ((Error?) -> Void)? = nil
    ) {
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: handle)
        // Strict policy: Customer Care Support never allows video
        let isVideo = (callType == "RANDOM_VIDEO" || callType == "CELEB_VIDEO") && callType != "SUPPORT_AUDIO"
        update.hasVideo = isVideo

        provider.reportNewIncomingCall(with: uuid, update: update) { error in
            completion?(error)
        }
    }

    public func startOutgoingCall(uuid: UUID, handle: String, callType: String) {
        let cxHandle = CXHandle(type: .generic, value: handle)
        let startCallAction = CXStartCallAction(call: uuid, handle: cxHandle)
        let isVideo = (callType == "RANDOM_VIDEO" || callType == "CELEB_VIDEO") && callType != "SUPPORT_AUDIO"
        startCallAction.isVideo = isVideo

        let transaction = CXTransaction(action: startCallAction)
        callController.request(transaction, completion: { _ in })
    }

    public func endCall(uuid: UUID) {
        let endAction = CXEndCallAction(call: uuid)
        let transaction = CXTransaction(action: endAction)
        callController.request(transaction, completion: { _ in })
    }

    public func providerDidReset(_ provider: CXProvider) {}
}
#endif
