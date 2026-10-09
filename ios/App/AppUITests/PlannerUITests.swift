import XCTest
import UIKit

// Interact with the real WKWebView through iOS accessibility. No injected JS,
// seeded storage, mocked plugins, or product-only test hooks.
final class PlannerUITests: XCTestCase {
    @MainActor
    func testPlannerSelectionAndImagePreview() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN"]
        app.launch()
        XCTAssertTrue(app.buttons["返回赛事首页"].waitForExistence(timeout: 30))
        capture("01-events", app)

        openKPC(app)
        capture("02-schedule", app)
        let first = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "查看 #1 KPC BANKROLL BUILDER · Day 1A 详情")).firstMatch
        XCTAssertTrue(first.waitForExistence(timeout: 20))
        tap(first, app)
        tap(app.staticTexts["参加"].firstMatch, app)
        tap(app.buttons["返回赛程"], app)
        tap(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "查看 #1 KPC BANKROLL BUILDER · Day 1B 详情")).firstMatch, app)
        tap(app.staticTexts["参加"].firstMatch, app)
        tap(app.buttons["返回赛程"], app)
        tap(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "关注 KPC BANKROLL BUILDER · Day 1C")).firstMatch, app)
        XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "不关注 KPC BANKROLL BUILDER · Day 1C")).firstMatch.waitForExistence(timeout: 10))
        capture("13-discovery-unwatch", app)
        tap(app.buttons["不关注 KPC BANKROLL BUILDER · Day 1C"], app)
        XCTAssertTrue(app.buttons["关注 KPC BANKROLL BUILDER · Day 1C"].waitForExistence(timeout: 10))
        tap(app.buttons["关注 KPC BANKROLL BUILDER · Day 1C"], app)

        openShortlist(app)
        assertShortlist(app)
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "₩1,600,000")).firstMatch.exists, "Two attending flights count; the watched flight adds no budget")
        capture("04-shortlist", app)

        // Remove directly from the fixed name column, without opening detail.
        tap(app.buttons["不关注 KPC BANKROLL BUILDER · Day 1C"], app)
        XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "全部自选 2")).firstMatch.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["不关注 KPC BANKROLL BUILDER · Day 1C"].exists)
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "₩1,600,000")).firstMatch.exists)
        tap(app.buttons["移出自选 KPC BANKROLL BUILDER · Day 1A"], app)
        XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "全部自选 1")).firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["移出自选 KPC BANKROLL BUILDER · Day 1B"].exists, "Removing one flight must retain its sibling")
        XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "₩1,600,000")).firstMatch.exists)
        capture("12-direct-row-removal", app)
        // Restore through the real discovery controls for the remaining checks.
        openKPC(app)
        tap(first, app)
        tap(app.staticTexts["参加"].firstMatch, app)
        tap(app.buttons["返回赛程"], app)
        tap(app.buttons["关注 KPC BANKROLL BUILDER · Day 1C"], app)
        openShortlist(app)
        assertShortlist(app)

        tap(app.buttons["我的日程"], app)
        XCTAssertTrue(app.staticTexts["仅显示参加和关注的比赛，点击日期查看当天。"].waitForExistence(timeout: 20))
        assertCalendar(app)
        capture("03-calendar", app)

        openShortlist(app)
        tap(app.buttons["导出图片"], app)
        XCTAssertTrue(app.buttons["关闭图片预览"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.images["完整自选表格"].exists)
        XCTAssertTrue(app.buttons["分享或存储图片"].isEnabled)
        capture("05-image", app)
        for attempt in 1...2 {
            tap(app.buttons["分享或存储图片"], app)
            dismissNativeShareSheet("09-image-share-\(attempt)", app, titlePrefix: "我的自选-", fileKind: "PNG", actionLabels: ["保存图像", "Save Image"])
            XCTAssertTrue(app.buttons["关闭图片预览"].exists)
            XCTAssertTrue(app.images["完整自选表格"].exists)
            XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "未能打开系统分享")).firstMatch.exists)
            let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: app.buttons["分享或存储图片"])
            XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 10), .completed)
        }
        tap(app.buttons["关闭图片预览"], app)

        tap(app.buttons["我的"], app)
        tap(app.buttons["导出备份"], app)
        dismissNativeShareSheet("10-plan-backup-share", app, titlePrefix: "赛事自选备份-", fileKind: "JSON", actionLabels: ["Save to Files", "存储到文件", "储存到档案", "保存到“文件”"])
        XCTAssertFalse(app.staticTexts["未能导出参赛自选备份，请重试。"].exists)
        tap(app.buttons["导出设置备份"], app)
        dismissNativeShareSheet("11-settings-backup-share", app, titlePrefix: "Events-Pro设置-", fileKind: "JSON", actionLabels: ["Save to Files", "存储到文件", "储存到档案", "保存到“文件”"])
        XCTAssertFalse(app.staticTexts["未能导出设置备份，请重试。"].exists)
        openShortlist(app)
        assertShortlist(app)
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "₩1,600,000")).firstMatch.exists)

        // Relaunch this same installation; this is persistence, not upgrade QA.
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["返回赛事首页"].waitForExistence(timeout: 30))
        openShortlist(app)
        assertShortlist(app)
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "₩1,600,000")).firstMatch.exists)
        capture("06-relaunch-retains-plan", app)
    }

    @MainActor
    private func dismissNativeShareSheet(_ name: String, _ app: XCUIApplication, titlePrefix: String, fileKind: String, actionLabels: [String]) {
        let activity = app.otherElements["ActivityListView"]
        if !activity.waitForExistence(timeout: 30) {
            capture("failure-" + name, app)
            XCTFail("Native activity controller did not open\n\(app.debugDescription)")
            return
        }
        // The activity container can exist while its remote content is blank.
        // Wait for the actual file preview and a usable system action before
        // cancelling, including the second image-share attempt.
        let title = app.otherElements["LP.CaptionBar.TopCaption"]
        guard title.waitForExistence(timeout: 60) else {
            capture("failure-empty-" + name, app)
            XCTFail("Native share file preview did not become ready\n\(app.debugDescription)")
            return
        }
        XCTAssertTrue(title.label.hasPrefix(titlePrefix), "Native menu must preview the current export")
        let details = app.otherElements["LP.CaptionBar.BottomCaption"]
        XCTAssertTrue(details.waitForExistence(timeout: 10))
        XCTAssertTrue(details.label.contains(fileKind), "Native preview must recognize the exported file type")
        // UIKit's iOS 27 Simplified Chinese action is 保存到“文件”; keep the
        // observed iOS 26 and other locale labels while requiring a file action.
        let action = app.cells.matching(NSPredicate(format: "identifier == %@ AND label IN %@", "actionGroupCell", actionLabels)).firstMatch
        guard action.waitForExistence(timeout: 20) else {
            capture("failure-action-" + name, app)
            XCTFail("Native share file action did not become ready\n\(app.debugDescription)")
            return
        }
        let close = app.buttons.matching(NSPredicate(format: "label == %@ OR label == %@", "Close", "关闭")).firstMatch
        capture(name, app)
        // Only dismiss the native controller. No recipient or external app is
        // selected; cancellation does not claim a file was delivered or saved.
        if close.exists {
            tap(close, app)
        } else {
            // iOS 26.2 presents a popover with this accessible backdrop instead
            // of a Close button. The observed popover starts below mid-screen;
            // tap the backdrop above it, never an activity or recipient.
            let backdrop = app.otherElements["PopoverDismissRegion"]
            XCTAssertTrue(backdrop.exists, "Missing native share dismissal region\n\(app.debugDescription)")
            let point = backdrop.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.1))
            XCTAssertFalse(activity.frame.contains(point.screenPoint), "Dismissal point must be outside the native activities")
            point.tap()
        }
        let dismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: activity)
        XCTAssertEqual(XCTWaiter.wait(for: [dismissed], timeout: 10), .completed)
        RunLoop.current.run(until: Date(timeIntervalSinceNow: 2))
    }

    // The harness invokes this separately after a real same-ID installation of
    // a higher native build. This method only reads the existing plan; it never
    // creates selections or restores a backup that could mask lost data.
    @MainActor
    func testRetainedPlanAfterInstall() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN"]
        app.launch()
        XCTAssertTrue(app.buttons["返回赛事首页"].waitForExistence(timeout: 30))
        openShortlist(app)
        assertShortlist(app)
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "₩1,600,000")).firstMatch.exists)
        capture("07-installed-build-retains-shortlist", app)
        // A new app launch can start on the default festival. Choose KPC via
        // normal navigation before checking its calendar, without editing data.
        openKPC(app)
        tap(app.buttons["我的日程"], app)
        XCTAssertTrue(app.staticTexts["仅显示参加和关注的比赛，点击日期查看当天。"].waitForExistence(timeout: 20))
        assertCalendar(app)
        capture("08-installed-build-retains-calendar", app)
    }

    @MainActor
    private func openKPC(_ app: XCUIApplication) {
        // The fixed navigation stays reachable after scrolling the shortlist.
        tap(app.buttons["赛事"], app)
        let kpc = app.links.matching(NSPredicate(format: "label CONTAINS %@", "KPC Poker Series Jeju 2026")).firstMatch
        if !kpc.exists {
            tap(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "已结束")).firstMatch, app)
        }
        tap(kpc, app)
    }

    @MainActor
    private func assertCalendar(_ app: XCUIApplication) {
        let activities = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@ AND (label CONTAINS %@ OR label CONTAINS %@)", "KPC BANKROLL BUILDER", "，参加", "，关注"))
        XCTAssertEqual(activities.count, 4, "Three selected starts and one conditional final day; no duplicate continuation")
    }

    @MainActor
    private func openShortlist(_ app: XCUIApplication) {
        tap(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "我的自选")).firstMatch, app)
    }

    @MainActor
    private func assertShortlist(_ app: XCUIApplication) {
        // WKWebView exposes the bold count and its trailing text separately.
        // Check the complete accessible category labels and their actual counts.
        for label in ["全部自选 3", "计划参加 2", "正在关注 1"] {
            let category = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
            if !category.waitForExistence(timeout: 20) {
                capture("failure-shortlist", app)
                XCTFail("Missing shortlist category: \(label)\n\(app.debugDescription)")
                return
            }
        }
    }

    @MainActor
    private func tap(_ element: XCUIElement, _ app: XCUIApplication) {
        XCTAssertTrue(element.waitForExistence(timeout: 20), "Missing native accessibility element: \(element)\n\(app.debugDescription)")
        for _ in 0..<6 {
            let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: element)
            if XCTWaiter.wait(for: [ready], timeout: 5) == .completed {
                element.tap()
                // XCTest's app-idle check can finish before WKWebView paints its
                // updated accessibility tree. Allow that frame to be presented
                // before the next native tap, including modal open/close.
                RunLoop.current.run(until: Date(timeIntervalSinceNow: 2))
                return
            }
            if element.frame.minY >= 0 && element.frame.maxY < app.frame.maxY - 90 { break }
            // Restored page scroll can leave the target above the viewport.
            // Scroll toward the actual accessible frame, in either direction.
            if element.frame.midY < app.frame.midY {
                app.swipeDown()
            } else {
                app.swipeUp()
            }
        }
        capture("failure-not-tappable", app)
        XCTFail("Native element is not tappable: \(element)\n\(app.debugDescription)")
    }

    @MainActor
    private func capture(_ name: String, _ app: XCUIApplication) {
        RunLoop.current.run(until: Date(timeIntervalSinceNow: 2))
        // Capture the complete native screen, including system chrome and safe
        // areas, rather than only the application's window after page scrolling.
        let screen = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screen)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        let accessibility = XCTAttachment(string: app.debugDescription)
        accessibility.name = name + "-accessibility"
        accessibility.lifetime = .keepAlways
        add(accessibility)
        guard let jpeg = UIImage(data: screen.pngRepresentation)?.jpegData(compressionQuality: 0.95) else {
            XCTFail("Could not encode native screenshot as JPEG")
            return
        }
        let opaque = XCTAttachment(data: jpeg, uniformTypeIdentifier: "public.jpeg")
        opaque.name = name + "-jpeg"
        opaque.lifetime = .keepAlways
        add(opaque)
    }
}
