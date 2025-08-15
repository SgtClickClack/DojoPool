"""Frontend performance testing script using Playwright."""

from typing import Dict, List, Optional
import asyncio
import json
import time
from datetime import datetime
from pathlib import Path

from playwright.async_api import async_playwright, Browser, Page, Response
import pytest


class PerformanceMetrics:
    """Class to collect and analyze performance metrics."""

    def __init__(self):
        self.metrics: Dict[str, List[float]] = {
            "ttfb": [],  # Time to First Byte
            "fcp": [],  # First Contentful Paint
            "lcp": [],  # Largest Contentful Paint
            "cls": [],  # Cumulative Layout Shift
            "fid": [],  # First Input Delay
            "load_time": [],  # Total Load Time
            "js_heap_size": [],  # JavaScript Heap Size
            "dom_nodes": [],  # Number of DOM Nodes
            "requests": [],  # Number of Network Requests
        }
        self.page_urls: List[str] = []

    def add_metric(self, name: str, value: float) -> None:
        """Add a metric value."""
        if name in self.metrics:
            self.metrics[name].append(value)

    def get_summary(self) -> Dict[str, Dict[str, float]]:
        """Get summary statistics for all metrics."""
        summary = {}
        for name, values in self.metrics.items():
            if values:
                summary[name] = {
                    "avg": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "p95": sorted(values)[int(len(values) * 0.95)],
                }
        return summary


async def measure_page_performance(page: Page, url: str) -> Dict[str, float]:
    """Measure performance metrics for a page."""
    # Enable performance metrics
    await page.route("**/*", lambda route: route.continue_())
    client = await page.context.new_cdp_session(page)
    await client.send("Performance.enable")

    # Navigate to page
    start_time = time.time()
    response = await page.goto(url, wait_until="networkidle")
    load_time = time.time() - start_time

    # Get performance metrics
    perf_metrics = await client.send("Performance.getMetrics")

    # Get Web Vitals
    web_vitals = await page.evaluate(
        """() => {
        const vitals = {};
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            vitals.ttfb = timing.responseStart - timing.navigationStart;
            vitals.fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
            vitals.lcp = performance.getEntriesByName('largest-contentful-paint')[0]?.startTime;
        }
        return vitals;
    }"""
    )

    # Get layout shifts
    cls = await page.evaluate(
        """() => {
        return window.performance.getEntriesByType('layout-shift')
            .reduce((sum, shift) => sum + shift.value, 0);
    }"""
    )

    # Collect metrics
    metrics = {
        "url": url,
        "load_time": load_time * 1000,  # Convert to ms
        "ttfb": web_vitals.get("ttfb", 0),
        "fcp": web_vitals.get("fcp", 0),
        "lcp": web_vitals.get("lcp", 0),
        "cls": cls,
        "js_heap_size": next(
            (m["value"] for m in perf_metrics["metrics"] if m["name"] == "JSHeapUsedSize"), 0
        ),
        "dom_nodes": next((m["value"] for m in perf_metrics["metrics"] if m["name"] == "Nodes"), 0),
    }

    return metrics


async def run_performance_test(base_url: str, routes: List[str]) -> None:
    """Run performance tests on specified routes."""
    metrics_collector = PerformanceMetrics()

    async with async_playwright() as playwright:
        # Launch browser with performance flags
        browser = await playwright.chromium.launch(
            args=[
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ]
        )

        # Create context with mobile device simulation
        devices = [playwright.devices["Pixel 5"], playwright.devices["iPhone 12"], None]  # Desktop

        for device in devices:
            context = await browser.new_context(
                bypass_csp=True,
                viewport={"width": 1920, "height": 1080} if not device else None,
                device=device,
            )

            page = await context.new_page()

            # Enable performance monitoring
            await page.coverage.start_js_coverage()

            # Test each route
            for route in routes:
                url = f"{base_url}{route}"
                try:
                    metrics = await measure_page_performance(page, url)

                    # Add device info to metrics
                    metrics["device"] = device.name if device else "desktop"

                    # Store metrics
                    for key, value in metrics.items():
                        if isinstance(value, (int, float)):
                            metrics_collector.add_metric(key, value)

                    metrics_collector.page_urls.append(url)

                except Exception as e:
                    print(f"Error testing {url}: {str(e)}")

            # Get JavaScript coverage
            js_coverage = await page.coverage.stop_js_coverage()

            # Calculate unused JavaScript
            total_bytes = sum(len(item["text"]) for item in js_coverage)
            used_bytes = sum(
                len(item["text"])
                for item in js_coverage
                if any(range["start"] != range["end"] for range in item["ranges"])
            )

            metrics_collector.add_metric("js_coverage", used_bytes / total_bytes * 100)

            await context.close()

        await browser.close()

    # Generate report
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": metrics_collector.get_summary(),
        "pages_tested": metrics_collector.page_urls,
        "thresholds": {
            "load_time": 3000,  # 3 seconds
            "ttfb": 100,  # 100ms
            "fcp": 1000,  # 1 second
            "lcp": 2500,  # 2.5 seconds
            "cls": 0.1,  # 0.1 threshold
            "js_coverage": 80,  # 80% usage
        },
    }

    # Save report
    report_path = Path("performance_reports")
    report_path.mkdir(exist_ok=True)

    with open(report_path / f"frontend_perf_{int(time.time())}.json", "w") as f:
        json.dump(report, f, indent=2)

    # Print summary
    print("\nPerformance Test Summary:")
    print("-" * 50)
    for metric, stats in report["summary"].items():
        print(f"\n{metric}:")
        for stat_name, value in stats.items():
            print(f"  {stat_name}: {value:.2f}")

    # Check thresholds
    print("\nThreshold Violations:")
    print("-" * 50)
    for metric, threshold in report["thresholds"].items():
        if metric in report["summary"]:
            avg_value = report["summary"][metric]["avg"]
            if avg_value > threshold:
                print(f"❌ {metric}: {avg_value:.2f} (threshold: {threshold})")
            else:
                print(f"✅ {metric}: {avg_value:.2f} (threshold: {threshold})")


if __name__ == "__main__":
    # Routes to test
    test_routes = ["/", "/rankings", "/game/new", "/profile", "/venues", "/tournaments"]

    asyncio.run(run_performance_test(base_url="http://localhost:3000", routes=test_routes))
