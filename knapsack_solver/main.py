"""
CLI entrypoint. Run:  python main.py
"""
from .data import get_sample_controls, DEFAULT_BUDGET_LAKH
from .models import OptimizationRequest
from .solver import solve_knapsack
from .display import (
    console,
    print_header,
    print_input_summary,
    print_all_controls,
    print_result,
    print_deferred_controls,
    print_future_budget,
    print_json_preview,
)


def main() -> None:
    print_header()

    # Later: replace get_sample_controls() with a call to the Monte Carlo
    # engine or a fetch from Supabase. Signature stays the same:
    # List[SecurityControl].
    request = OptimizationRequest(
        controls=get_sample_controls(),
        budget=DEFAULT_BUDGET_LAKH,
    )

    print_input_summary(request)
    print_all_controls(request)

    console.print("\n[bold]⚙️  Running solver...[/bold]")
    result = solve_knapsack(request)

    print_result(result)
    print_deferred_controls(result)
    print_future_budget(result)
    print_json_preview(result)


if __name__ == "__main__":
    main()