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

        let kpc = app.links.matching(NSPredicate(format: "label CONTAINS %@", "KPC Poker Series Jeju 2026")).firstMatch
        if !kpc.exists {
            tap(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "已结束")).firstMatch, app)
        }
        tap(kpc, app)
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
        XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "取消关注 KPC BANKROLL BUILDER · Day 1C")).firstMatch.waitForExistence(timeout: 10))

        openShortlist(app)
        assertShortlist(app)
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "₩1,600,000")).firstMatch.exists, "Two attending flights count; the watched flight adds no budget")
        capture("04-shortlist", app)

        tap(app.buttons["我的日程"], app)
        XCTAssertTrue(app.staticTexts["仅显示参加和关注的比赛，点击日期查看当天。"].waitForExistence(timeout: 20))
        let activities = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@ AND (label CONTAINS %@ OR label CONTAINS %@)", "KPC BANKROLL BUILDER", "，参加", "，关注"))
        XCTAssertEqual(activities.count, 4, "Three selected starts and one conditional final day; no duplicate continuation")
        capture("03-calendar", app)

        openShortlist(app)
        tap(app.buttons["导出图片"], app)
        XCTAssertTrue(app.buttons["关闭图片预览"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.images["完整自选表格"].exists)
        XCTAssertTrue(app.buttons["分享或存储图片"].isEnabled)
        capture("05-image", app)
        tap(app.buttons["关闭图片预览"], app)

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
            app.swipeUp()
        }
        capture("failure-not-tappable", app)
        XCTFail("Native element is not tappable: \(element)\n\(app.debugDescription)")
    }

    @MainActor
    private func capture(_ name: String, _ app: XCUIApplication) {
        RunLoop.current.run(until: Date(timeIntervalSinceNow: 2))
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        let accessibility = XCTAttachment(string: app.debugDescription)
        accessibility.name = name + "-accessibility"
        accessibility.lifetime = .keepAlways
        add(accessibility)
        guard let jpeg = UIImage(data: app.screenshot().pngRepresentation)?.jpegData(compressionQuality: 0.95) else {
            XCTFail("Could not encode native screenshot as JPEG")
            return
        }
        let opaque = XCTAttachment(data: jpeg, uniformTypeIdentifier: "public.jpeg")
        opaque.name = name + "-jpeg"
        opaque.lifetime = .keepAlways
        add(opaque)
    }
}
