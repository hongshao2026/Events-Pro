import XCTest

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

        tap(app.links.matching(NSPredicate(format: "label CONTAINS %@", "KPC Poker Series Jeju 2026")).firstMatch, app)
        let first = app.buttons["查看 #1 KPC BANKROLL BUILDER · Day 1A 详情"]
        XCTAssertTrue(first.waitForExistence(timeout: 20))
        capture("02-schedule", app)
        tap(first, app)
        tap(app.staticTexts["参加"].firstMatch, app)
        tap(app.buttons["返回赛程"], app)
        tap(app.buttons["关注 KPC BANKROLL BUILDER · Day 1B"], app)
        XCTAssertTrue(app.buttons["取消关注 KPC BANKROLL BUILDER · Day 1B"].waitForExistence(timeout: 10))

        openShortlist(app)
        XCTAssertTrue(app.staticTexts["2 条自选"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "800,000")).firstMatch.exists)
        capture("04-shortlist", app)

        tap(app.buttons["我的日程"], app)
        XCTAssertTrue(app.staticTexts["仅显示参加和关注的比赛，点击日期查看当天。"].waitForExistence(timeout: 20))
        let activities = app.buttons.matching(NSPredicate(format: "label CONTAINS %@ AND (label CONTAINS %@ OR label CONTAINS %@)", "KPC BANKROLL BUILDER", "，参加", "，关注"))
        XCTAssertEqual(activities.count, 3, "Two selected starts and one conditional final day; no duplicate continuation")
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
        XCTAssertTrue(app.staticTexts["2 条自选"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "800,000")).firstMatch.exists)
        capture("06-relaunch-retains-plan", app)
    }

    @MainActor
    private func openShortlist(_ app: XCUIApplication) {
        tap(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "我的自选")).firstMatch, app)
    }

    @MainActor
    private func tap(_ element: XCUIElement, _ app: XCUIApplication) {
        XCTAssertTrue(element.waitForExistence(timeout: 20), "Missing native accessibility element: \(element)")
        for _ in 0..<6 {
            if element.isHittable { element.tap(); return }
            app.swipeUp()
        }
        XCTFail("Native element is not tappable: \(element)")
    }

    @MainActor
    private func capture(_ name: String, _ app: XCUIApplication) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
