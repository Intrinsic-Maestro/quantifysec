"""
Terminal rendering with Rich. Only place that prints anything.
"""
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.box import ROUNDED, HEAVY
from rich.rule import Rule
from rich.syntax import Syntax

from models import OptimizationRequest, OptimizationResult

console = Console()


def print_header() -> None:
    console.print()
    console.print(Panel.fit(
        "[bold cyan]Cybersecurity Control Optimizer[/bold cyan]\n"
        "[dim]0-1 Knapsack ILP · PuLP + CBC[/dim]",
        border_style="cyan",
        box=HEAVY,
    ))


def print_input_summary(request: OptimizationRequest) -> None:
    total_cost_all = sum(c.cost for c in request.controls)
    total_red_all = sum(c.risk_reduction for c in request.controls)

    table = Table(
        title="📥 Input Summary", box=ROUNDED,
        show_header=False, title_style="bold yellow",
    )
    table.add_column(style="bold")
    table.add_column(justify="right")
    table.add_row("Controls available",       f"{len(request.controls)}")
    table.add_row("Budget",                   f"₹{request.budget:.0f} lakh")
    table.add_row("Cost if ALL selected",     f"₹{total_cost_all:.0f} lakh")
    table.add_row("Max possible reduction",   f"₹{total_red_all:.0f} lakh")
    console.print(table)


def print_all_controls(request: OptimizationRequest) -> None:
    table = Table(
        title="🛡️  Candidate Security Controls",
        box=ROUNDED, title_style="bold blue",
    )
    table.add_column("ID", style="dim")
    table.add_column("Control", style="bold")
    table.add_column("Category", style="cyan")
    table.add_column("Cost (₹L)", justify="right")
    table.add_column("Risk Reduction (₹L)", justify="right", style="green")
    table.add_column("Efficiency", justify="right", style="magenta")

    for c in request.controls:
        eff = c.risk_reduction / c.cost if c.cost > 0 else 0.0
        table.add_row(
            c.id, c.name, c.category or "-",
            f"{c.cost:.0f}", f"{c.risk_reduction:.0f}", f"{eff:.2f}",
        )
    console.print(table)


def _budget_bar(pct: float, width: int = 50) -> str:
    filled = min(int(round(pct / 100.0 * width)), width)
    return "█" * filled + "░" * (width - filled)


def print_result(result: OptimizationResult) -> None:
    ok = result.status == "Optimal"
    color = "green" if ok else "red"
    icon = "✅" if ok else "❌"

    console.print()
    console.print(Panel.fit(
        f"[bold {color}]{icon} Solver Status: {result.status}[/bold {color}]\n"
        f"[dim]Solved in {result.solver_time_seconds}s[/dim]",
        border_style=color,
    ))

    if not ok:
        console.print(
            f"[{color}]No optimal solution. "
            f"Check constraints or input data.[/{color}]"
        )
        return

    # Selected controls
    table = Table(
        title=f"🎯 Selected Controls ({len(result.selected_controls)} chosen)",
        box=ROUNDED, title_style="bold green",
    )
    table.add_column("ID", style="dim")
    table.add_column("Control", style="bold")
    table.add_column("Category", style="cyan")
    table.add_column("Cost (₹L)", justify="right")
    table.add_column("Risk Reduction (₹L)", justify="right", style="green")
    table.add_column("Efficiency", justify="right", style="magenta")

    for c in result.selected_controls:
        table.add_row(
            c.id, c.name, c.category or "-",
            f"{c.cost:.0f}", f"{c.risk_reduction:.0f}", f"{c.efficiency:.2f}",
        )
    console.print(table)

    # Summary
    summary = Table(
        title="📊 Optimization Summary", box=ROUNDED,
        show_header=False, title_style="bold yellow",
    )
    summary.add_column(style="bold")
    summary.add_column(justify="right")
    summary.add_row("Total Cost",
                    f"₹{result.total_cost:.0f} L / ₹{result.budget:.0f} L")
    summary.add_row("Budget Utilization",
                    f"{result.budget_utilization_pct:.1f}%")
    summary.add_row("Budget Remaining",
                    f"₹{result.budget_remaining:.0f} L")
    summary.add_row("Total Risk Reduction",
                    f"[bold green]₹{result.total_risk_reduction:.0f} L[/bold green]")
    summary.add_row("Deferred Controls",
                    f"{len(result.deferred_controls)}")
    console.print(summary)

    # Budget bar
    console.print()
    console.print("[bold]Budget Usage:[/bold]")
    bar = _budget_bar(result.budget_utilization_pct)
    console.print(f"[green]{bar}[/green] {result.budget_utilization_pct:.1f}%")


def print_deferred_controls(result: OptimizationResult) -> None:
    """Show the controls the solver did NOT pick — the future-cycle backlog."""
    if not result.deferred_controls:
        console.print()
        console.print(Panel.fit(
            "[bold green]🎉 All available controls were selected — "
            "no deferred backlog.[/bold green]",
            border_style="green",
        ))
        return

    console.print()
    console.print(Rule("[bold yellow]Deferred Controls — Next Budget Cycle[/bold yellow]"))

    table = Table(
        title=f"⏭️  Deferred Controls ({len(result.deferred_controls)} not funded this cycle)",
        box=ROUNDED, title_style="bold yellow",
        caption="Sorted by priority (highest efficiency first)",
    )
    table.add_column("Priority", justify="right", style="bold yellow")
    table.add_column("ID", style="dim")
    table.add_column("Control", style="bold")
    table.add_column("Category", style="cyan")
    table.add_column("Est. Cost (₹L)", justify="right")
    table.add_column("Potential Reduction (₹L)", justify="right", style="green")
    table.add_column("Efficiency", justify="right", style="magenta")

    for d in result.deferred_controls:
        table.add_row(
            f"#{d.priority_rank}",
            d.id, d.name, d.category or "-",
            f"{d.cost:.0f}", f"{d.risk_reduction:.0f}", f"{d.efficiency:.2f}",
        )
    console.print(table)


def print_future_budget(result: OptimizationResult) -> None:
    """Approximate future budget requirements + the mandatory warning."""
    fb = result.future_budget
    if fb is None:
        return

    summary = Table(
        title="💰 Approximate Future Budget Requirement",
        box=ROUNDED, show_header=False, title_style="bold magenta",
    )
    summary.add_column(style="bold")
    summary.add_column(justify="right")
    summary.add_row("Deferred controls",
                    f"{fb.deferred_count}")
    summary.add_row("Total cost of ALL deferred (₹L)",
                    f"≈ ₹{fb.total_deferred_cost:.0f} L")
    summary.add_row("Additional risk reduction available (₹L)",
                    f"[green]≈ ₹{fb.total_deferred_reduction:.0f} L[/green]")
    summary.add_row("Suggested next-cycle budget (~50% of backlog)",
                    f"[bold cyan]≈ ₹{fb.approx_next_cycle_budget:.0f} L[/bold cyan]")
    summary.add_row("Full-coverage budget (+15% buffer)",
                    f"[bold cyan]≈ ₹{fb.approx_full_coverage_budget:.0f} L[/bold cyan]")
    console.print(summary)

    # The warning the user explicitly asked for.
    console.print()
    console.print(Panel(
        "[bold yellow]⚠  NOTE ON FUTURE BUDGET FIGURES[/bold yellow]\n\n"
        "[white]The future budget values shown above are [bold]approximate "
        "estimates only[/bold]. Actual figures will vary based on:[/white]\n"
        "  • Vendor price changes and renewal terms\n"
        "  • Inflation and INR exchange fluctuations\n"
        "  • Shifts in the threat landscape (new CVEs, attack trends)\n"
        "  • Re-runs of the Monte Carlo Risk Engine with updated data\n"
        "  • Organizational changes (headcount, asset inventory, compliance scope)\n\n"
        "[dim]Treat these as planning-level guidance, not procurement quotes. "
        "Re-run the optimizer whenever your risk model or cost data is refreshed.[/dim]",
        border_style="yellow",
        title="[bold]Approximation Warning[/bold]",
        title_align="left",
    ))


def print_json_preview(result: OptimizationResult) -> None:
    """Preview the exact JSON your FastAPI endpoint will return."""
    console.print()
    console.print(Rule("[dim]API Response Preview (frontend contract)[/dim]"))
    console.print(Syntax(
        result.model_dump_json(indent=2),
        "json", theme="monokai", line_numbers=False,
    ))