from collections import defaultdict
from math import hypot
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "text_img"
OUTPUT_FILE = ROOT / "src" / "glyphVectors.ts"


Point = tuple[float, float]
GridPoint = tuple[int, int]
Edge = tuple[GridPoint, GridPoint]


def is_circle_loop(points: list[Point], tolerance_ratio: float = 0.12) -> bool:
    if len(points) < 8:
        return False
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    w = max_x - min_x
    h = max_y - min_y
    if h == 0 or w == 0:
        return False
    aspect = w / h
    if not (0.75 <= aspect <= 1.33):
        return False
    
    cx = (min_x + max_x) / 2
    cy = (min_y + max_y) / 2
    
    distances = [hypot(p[0] - cx, p[1] - cy) for p in points]
    mean_radius = sum(distances) / len(distances)
    if mean_radius < 3.0: 
        return False
    
    variance = sum((r - mean_radius) ** 2 for r in distances) / len(distances)
    std_dev = variance ** 0.5
    ratio = std_dev / mean_radius
    max_dev = max(abs(r - mean_radius) for r in distances)
    max_dev_ratio = max_dev / mean_radius
    
    if mean_radius < 6.0:
        return ratio < 0.25 and max_dev_ratio < 0.55
    elif mean_radius < 12.0:
        return ratio < 0.15 and max_dev_ratio < 0.35
    else:
        return ratio < 0.12 and max_dev_ratio < 0.25


def mask_to_path(mask: np.ndarray) -> str:
    loops = trace_loops(mask)
    if not loops:
        return ""

    height, width = mask.shape
    parts: list[str] = []

    for loop in loops:
        if is_circle_loop(loop):
            xs = [p[0] for p in loop]
            ys = [p[1] for p in loop]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            cx = (min_x + max_x) / 2
            cy = (min_y + max_y) / 2
            mean_radius = sum(hypot(p[0] - cx, p[1] - cy) for p in loop) / len(loop)
            parts.append(
                f"M {cx-mean_radius:.2f} {cy:.2f} "
                f"A {mean_radius:.2f} {mean_radius:.2f} 0 1 0 {cx+mean_radius:.2f} {cy:.2f} "
                f"A {mean_radius:.2f} {mean_radius:.2f} 0 1 0 {cx-mean_radius:.2f} {cy:.2f} Z"
            )
        else:
            tolerance = 0.7 if max(width, height) <= 30 else 2.8
            radius = 0.9 if max(width, height) <= 30 else 2.2
            simplified = simplify_closed_loop(loop, tolerance)
            if len(simplified) >= 3:
                parts.append(loop_to_rounded_path(simplified, radius))

    return "".join(parts)


def trace_loops(mask: np.ndarray) -> list[list[Point]]:
    edges: set[Edge] = set()
    height, width = mask.shape

    for y in range(height):
        for x in range(width):
            if not mask[y, x]:
                continue

            if y == 0 or not mask[y - 1, x]:
                edges.add(((x, y), (x + 1, y)))
            if x == width - 1 or not mask[y, x + 1]:
                edges.add(((x + 1, y), (x + 1, y + 1)))
            if y == height - 1 or not mask[y + 1, x]:
                edges.add(((x + 1, y + 1), (x, y + 1)))
            if x == 0 or not mask[y, x - 1]:
                edges.add(((x, y + 1), (x, y)))

    by_start: dict[GridPoint, list[Edge]] = defaultdict(list)
    for edge in edges:
        by_start[edge[0]].append(edge)

    loops: list[list[Point]] = []
    while edges:
        start_edge = min(edges)
        edges.remove(start_edge)

        start, end = start_edge
        loop: list[GridPoint] = [start, end]
        previous_direction = direction(start, end)

        while end != start:
            candidates = [edge for edge in by_start[end] if edge in edges]
            if not candidates:
                break

            next_edge = choose_next_edge(previous_direction, candidates)
            edges.remove(next_edge)
            _, next_end = next_edge
            previous_direction = direction(end, next_end)
            end = next_end
            loop.append(end)

        if loop[-1] == start:
            loop.pop()

        if len(loop) >= 3:
            loops.append([(float(x), float(y)) for x, y in loop])

    return loops


def choose_next_edge(previous_direction: GridPoint, candidates: list[Edge]) -> Edge:
    previous_index = direction_index(previous_direction)
    turn_priority = {1: 0, 0: 1, 3: 2, 2: 3}

    def score(edge: Edge) -> tuple[int, GridPoint, GridPoint]:
        candidate_index = direction_index(direction(edge[0], edge[1]))
        turn = (candidate_index - previous_index) % 4
        return (turn_priority[turn], edge[0], edge[1])

    return min(candidates, key=score)


def direction(start: GridPoint, end: GridPoint) -> GridPoint:
    return (end[0] - start[0], end[1] - start[1])


def direction_index(vector: GridPoint) -> int:
    return {
        (1, 0): 0,
        (0, 1): 1,
        (-1, 0): 2,
        (0, -1): 3,
    }[vector]


def simplify_closed_loop(points: list[Point], tolerance: float) -> list[Point]:
    points = remove_collinear(points)
    if len(points) <= 3:
        return points

    simplified = rdp(points + [points[0]], tolerance)
    if simplified[0] == simplified[-1]:
        simplified.pop()

    return remove_collinear(simplified)


def remove_collinear(points: list[Point]) -> list[Point]:
    if len(points) < 3:
        return points

    cleaned: list[Point] = []
    for index, point in enumerate(points):
        previous = points[index - 1]
        next_point = points[(index + 1) % len(points)]
        if not is_collinear(previous, point, next_point):
            cleaned.append(point)

    return cleaned


def is_collinear(a: Point, b: Point, c: Point) -> bool:
    cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
    return abs(cross) < 0.0001


def rdp(points: list[Point], tolerance: float) -> list[Point]:
    if len(points) <= 2:
        return points

    start, end = points[0], points[-1]
    max_distance = -1.0
    max_index = 0

    for index in range(1, len(points) - 1):
        current_distance = perpendicular_distance(points[index], start, end)
        if current_distance > max_distance:
            max_distance = current_distance
            max_index = index

    if max_distance > tolerance:
        left = rdp(points[: max_index + 1], tolerance)
        right = rdp(points[max_index:], tolerance)
        return left[:-1] + right

    return [start, end]


def perpendicular_distance(point: Point, start: Point, end: Point) -> float:
    if start == end:
        return distance(point, start)

    numerator = abs(
        (end[1] - start[1]) * point[0]
        - (end[0] - start[0]) * point[1]
        + end[0] * start[1]
        - end[1] * start[0]
    )
    return numerator / distance(start, end)


def loop_to_rounded_path(points: list[Point], radius: float) -> str:
    corners = [rounded_corner(points, index, radius) for index in range(len(points))]
    first_after = corners[0][1]
    commands = [f"M{format_point(first_after)}"]

    for index in range(1, len(points)):
        before, after = corners[index]
        commands.append(f"L{format_point(before)}Q{format_point(points[index])} {format_point(after)}")

    first_before, first_after = corners[0]
    commands.append(f"L{format_point(first_before)}Q{format_point(points[0])} {format_point(first_after)}Z")
    return "".join(commands)


def rounded_corner(points: list[Point], index: int, radius: float) -> tuple[Point, Point]:
    previous = points[index - 1]
    current = points[index]
    next_point = points[(index + 1) % len(points)]
    previous_distance = distance(current, previous)
    next_distance = distance(current, next_point)
    corner_radius = min(radius, previous_distance / 2, next_distance / 2)

    before = interpolate(current, previous, corner_radius / previous_distance)
    after = interpolate(current, next_point, corner_radius / next_distance)
    return before, after


def interpolate(start: Point, end: Point, amount: float) -> Point:
    return (start[0] + (end[0] - start[0]) * amount, start[1] + (end[1] - start[1]) * amount)


def distance(a: Point, b: Point) -> float:
    return hypot(a[0] - b[0], a[1] - b[1])


def format_point(point: Point) -> str:
    return f"{format_number(point[0])} {format_number(point[1])}"


def format_number(value: float) -> str:
    rounded = round(value, 2)
    if rounded == int(rounded):
        return str(int(rounded))

    return f"{rounded:.2f}".rstrip("0").rstrip(".")


def main() -> None:
    entries: list[str] = []

    for image_path in sorted(SOURCE_DIR.glob("*.png")):
        if image_path.stem.endswith("_org"):
            continue

        image = Image.open(image_path).convert("RGBA")
        alpha = np.array(image)[:, :, 3]
        path = mask_to_path(alpha > 0)
        width, height = image.size

        entries.append(
            f'  "{image_path.name}": {{ width: {width}, height: {height}, path: "{path}" }},'
        )

    output = "\n".join(
        [
            "export type GlyphVector = {",
            "  width: number;",
            "  height: number;",
            "  path: string;",
            "};",
            "",
            "export const glyphVectors: Readonly<Record<string, GlyphVector>> = {",
            *entries,
            "};",
            "",
        ]
    )

    OUTPUT_FILE.write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
