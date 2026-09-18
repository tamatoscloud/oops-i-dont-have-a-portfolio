"""Rasterize the portfolio PDF, crop reading beats, write issue.json."""

from __future__ import annotations

import json
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "Portfolio (1).pdf"
FRAMES = ROOT / "public" / "frames"
THUMBS = ROOT / "public" / "thumbs"
PAGES = ROOT / "public" / "pages"
CONTENT = ROOT / "src" / "content" / "issue.json"

# A4 @ 288dpi, capped so punch-in stays sharp on retina without huge files
DPI = 288
MAX_EDGE = 2200
MAX_PAGE_EDGE = 2880
WEBP_QUALITY = 78
THUMB_WIDTH = 280

# l, t, w, h as fractions of the full page
FULL = [0.034, 0.022, 0.932, 0.956]


def P(
    pid: str,
    box: list[float],
    role: str,
    caption: str = "",
    quote: str = "",
    pin: bool = False,
    ken_burns: bool = False,
    hold: float | None = None,
    semantic_tag: str | None = None,
    camera: dict | None = None,
) -> dict:
    data = {
        "id": pid,
        "box": box,
        "role": role,
        "caption": caption,
        "quote": quote,
        "pin": pin,
        "kenBurns": ken_burns,
    }
    if hold is not None:
        data["hold"] = hold
    if semantic_tag:
        data["semanticTag"] = semantic_tag
    if camera:
        data["camera"] = camera
    return data


CHAPTERS = [
    {
        "id": "cover",
        "title": "Oops, I Don't Have a Portfolio.",
        "kicker": "Vol. 01 — An argument for the work behind the work",
        "page": 1,
        "panels": [
            P(
                "cover-splash",
                FULL,
                "splash",
                "Senior Strategist. Sydney. Australian Permanent Resident.",
                pin=True,
                ken_burns=True,
            ),
            P(
                "cover-airport",
                [0.36, 0.20, 0.60, 0.30],
                "wide",
                "Right place. Wrong context.",
            ),
            P(
                "cover-context",
                [0.045, 0.22, 0.33, 0.26],
                "portrait",
                "The first thing a new country takes away is your context.",
            ),
            P(
                "cover-step-1",
                [0.045, 0.49, 0.48, 0.105],
                "detail",
                "Back home: known, not famous. Advertising famous.",
            ),
            P(
                "cover-step-2",
                [0.045, 0.59, 0.48, 0.09],
                "detail",
                "That tiny celebrity status expires between baggage claim and customs.",
            ),
            P(
                "cover-step-3",
                [0.045, 0.675, 0.48, 0.09],
                "detail",
                "Suddenly you need three things: a resume, a cover letter, and a portfolio.",
            ),
            P(
                "cover-step-4",
                [0.045, 0.76, 0.48, 0.10],
                "detail",
                "The portfolio is where the trouble begins.",
            ),
            P(
                "cover-quote",
                [0.52, 0.50, 0.44, 0.38],
                "wide",
                "",
                "You land with fourteen years of experience and the professional recognition of a man who has joined the wrong group chat.",
                pin=True,
            ),
        ],
    },
    {
        "id": "what-is-a-portfolio",
        "title": "But what is a strategy portfolio again?",
        "kicker": "The campaign is the plate. Strategy is everything that happened in the kitchen.",
        "page": 2,
        "panels": [
            P(
                "p2-header",
                [0.04, 0.028, 0.92, 0.135],
                "wide",
                "The campaign is the plate. Strategy is everything that happened in the kitchen.",
            ),
            P(
                "p2-usual",
                [0.04, 0.16, 0.455, 0.255],
                "grid-beat",
                "The usual answer: finished campaigns, neat case studies, a graph moving up and to the right.",
            ),
            P(
                "p2-award",
                [0.50, 0.16, 0.455, 0.255],
                "grid-beat",
                "Obey the story. Serve the outcome. Delete the chaos.",
            ),
            P(
                "p2-story",
                [0.04, 0.415, 0.455, 0.255],
                "grid-beat",
                "The story that makes it in never mentions the arguments, dead ideas, and chaos in between.",
            ),
            P(
                "p2-not-pointless",
                [0.50, 0.415, 0.455, 0.255],
                "grid-beat",
                "Finished campaigns do not tell the whole truth about strategy.",
            ),
            P(
                "p2-quote",
                [0.04, 0.67, 0.92, 0.20],
                "splash",
                "Show the work. Earn the trust. Then the work speaks louder.",
                "The campaign is the plate. Strategy is the recipe, the shopping, the missing ingredient, the argument in the kitchen, and the moment someone quietly changes the dish after you leave the room.",
                pin=True,
                ken_burns=True,
            ),
        ],
    },
    {
        "id": "the-market",
        "title": "Before the brands, the market",
        "kicker": "Before the work, you need the country behind it.",
        "page": 3,
        "panels": [
            P(
                "p3-header",
                [0.04, 0.028, 0.92, 0.16],
                "wide",
                "Before the work, you need the country behind it.",
            ),
            P(
                "p3-pakistan",
                [0.40, 0.155, 0.555, 0.28],
                "wide",
                "Karachi feels like almost the population of Australia compressed into one concrete organism.",
                ken_burns=True,
            ),
            P(
                "p3-census",
                [0.04, 0.185, 0.36, 0.18],
                "detail",
                "2023 census: more than 241 million people. In conversation, round it to 250.",
            ),
            P(
                "p3-no-data",
                [0.04, 0.37, 0.28, 0.28],
                "portrait",
                "No retail audits. No brand health. No reliable category numbers. Planning meant asking uncomfortable questions.",
            ),
            P(
                "p3-mattress",
                [0.325, 0.44, 0.21, 0.22],
                "detail",
                "1. Banking was competing with the mattress.",
            ),
            P(
                "p3-milkman",
                [0.535, 0.44, 0.21, 0.22],
                "detail",
                "2. Packaged milk was fighting a milkman who knew your gate.",
            ),
            P(
                "p3-icecream",
                [0.745, 0.44, 0.21, 0.22],
                "detail",
                "3. Ice cream and life insurance sat at the same tiny level of penetration.",
            ),
            P(
                "p3-desk",
                [0.325, 0.66, 0.63, 0.25],
                "wide",
                "Numbers without context are just decoration. Real insight lives outside the default data.",
            ),
            P(
                "p3-quote",
                [0.04, 0.66, 0.28, 0.28],
                "portrait",
                "",
                "The easy answers did not exist. Consumers needed a reason to care long before they needed a reason to buy.",
            ),
        ],
    },
    {
        "id": "building-strategy",
        "title": "The first category I had to build was strategy",
        "kicker": "In a mature market, a strategist receives a brief. In mine, the brief often arrived as an answer.",
        "page": 4,
        "panels": [
            P(
                "p4-header",
                [0.04, 0.028, 0.92, 0.12],
                "wide",
                "In a mature market, a strategist receives a brief. In mine, the brief often arrived as an answer.",
            ),
            P(
                "p4-bubbles",
                [0.04, 0.145, 0.92, 0.10],
                "wide",
                "We need a television commercial. We need something digital. We need sales. We need it before Monday.",
            ),
            P(
                "p4-war-room",
                [0.04, 0.245, 0.50, 0.32],
                "wide",
                "So… what's the real problem here?",
                ken_burns=True,
            ),
            P(
                "p4-backwards",
                [0.545, 0.245, 0.415, 0.32],
                "portrait",
                "The output had already been ordered. Research was expensive. Assumptions were free.",
            ),
            P(
                "p4-explain",
                [0.04, 0.57, 0.40, 0.32],
                "portrait",
                "A deliverable is not a brief. An offer is not a positioning. A consumer is more than a wallet attached to a mobile phone.",
            ),
            P(
                "p4-quote",
                [0.44, 0.57, 0.52, 0.35],
                "wide",
                "Deadline hostage situation.",
                "The strategist had to be a researcher, teacher, translator, provocateur, diplomat, and on particularly difficult afternoons, a hostage negotiator with PowerPoint.",
                pin=True,
            ),
        ],
    },
    {
        "id": "career",
        "title": "What I have actually spent my career doing",
        "kicker": "The category list is long. The more useful version is this.",
        "page": 5,
        "panels": [
            P(
                "p5-header",
                [0.04, 0.028, 0.92, 0.145],
                "wide",
                "The category list is long. The more useful version is this.",
            ),
            P(
                "p5-tiger",
                [0.04, 0.175, 0.455, 0.155],
                "grid-beat",
                "Tiger: stop talking only about price and energy. Start defending childhood itself.",
            ),
            P(
                "p5-auto",
                [0.50, 0.175, 0.455, 0.155],
                "grid-beat",
                "Automobile: not just a bigger car. A bigger life.",
            ),
            P(
                "p5-milk",
                [0.04, 0.33, 0.455, 0.155],
                "grid-beat",
                "Packaged milk: the real competitor was a boiling pot in almost every kitchen.",
            ),
            P(
                "p5-insurance",
                [0.50, 0.33, 0.455, 0.155],
                "grid-beat",
                "Life insurance: not selling a policy. Earning the courage to care.",
            ),
            P(
                "p5-banking",
                [0.04, 0.485, 0.455, 0.155],
                "grid-beat",
                "Banking: first we earn trust. Then we earn the right to serve.",
            ),
            P(
                "p5-contraception",
                [0.50, 0.485, 0.455, 0.155],
                "grid-beat",
                "Contraception: real strength is choosing responsibly.",
            ),
            P(
                "p5-school",
                [0.04, 0.64, 0.455, 0.155],
                "grid-beat",
                "Girls into school: let her dreams weigh as much.",
            ),
            P(
                "p5-furniture",
                [0.50, 0.64, 0.455, 0.155],
                "grid-beat",
                "Premium furniture: real quality doesn't shout. It stays.",
            ),
            P(
                "p5-quote",
                [0.04, 0.80, 0.92, 0.16],
                "wide",
                "",
                "Most of these problems did not arrive in a clean brief. Most arrived disguised as requests for an advertisement.",
                pin=True,
            ),
        ],
    },
    {
        "id": "trenches-1",
        "title": "Three stories from the trenches",
        "kicker": "Tiger. Rimula. Olper's.",
        "page": 6,
        "panels": [
            P(
                "p6-header",
                [0.04, 0.028, 0.92, 0.11],
                "wide",
                "Three stories from the trenches.",
            ),
            P(
                "p6-tiger-copy",
                [0.04, 0.14, 0.22, 0.28],
                "portrait",
                "Tiger Biscuits and the right to remain a child.",
            ),
            P(
                "p6-tiger-strip",
                [0.26, 0.135, 0.70, 0.22],
                "wide",
                "From filling a stomach to defending a right.",
                ken_burns=True,
            ),
            P(
                "p6-tiger-quote",
                [0.26, 0.355, 0.70, 0.07],
                "wide",
                "",
                "Parents, let children be children.",
            ),
            P(
                "p6-rimula-copy",
                [0.04, 0.43, 0.22, 0.28],
                "portrait",
                "Shell Rimula and the truckers we salute.",
            ),
            P(
                "p6-rimula-strip",
                [0.26, 0.43, 0.70, 0.22],
                "wide",
                "Hardworking oil. For hardworking people.",
                ken_burns=True,
            ),
            P(
                "p6-rimula-quote",
                [0.26, 0.65, 0.70, 0.065],
                "wide",
                "",
                "Behind every delivery is a story of sacrifice. We salute the people who keep Pakistan moving.",
            ),
            P(
                "p6-olpers-copy",
                [0.04, 0.72, 0.22, 0.22],
                "portrait",
                "Olper's and the boiling pot.",
            ),
            P(
                "p6-olpers-strip",
                [0.26, 0.72, 0.70, 0.18],
                "wide",
                "You boil, you spoil.",
                ken_burns=True,
            ),
        ],
    },
    {
        "id": "trenches-2",
        "title": "And three more.",
        "kicker": "Josh. Lifebuoy. Habitt.",
        "page": 7,
        "panels": [
            P(
                "p7-header",
                [0.04, 0.028, 0.92, 0.10],
                "wide",
                "And three more.",
            ),
            P(
                "p7-josh",
                [0.04, 0.125, 0.50, 0.22],
                "wide",
                "Josh and the uncomfortable meaning of masculinity.",
                ken_burns=True,
            ),
            P(
                "p7-josh-copy",
                [0.545, 0.125, 0.415, 0.22],
                "detail",
                "",
                "You are not selling contraception. You are renegotiating the meaning of being a man.",
            ),
            P(
                "p7-lifebuoy",
                [0.04, 0.35, 0.50, 0.25],
                "wide",
                "Lifebuoy and the glass of milk.",
                ken_burns=True,
            ),
            P(
                "p7-lifebuoy-copy",
                [0.545, 0.35, 0.415, 0.25],
                "detail",
                "Meri beti parhay gee.",
                "The boy was seen as the family's future. The girl was raised for someone else's.",
            ),
            P(
                "p7-habitt",
                [0.04, 0.605, 0.50, 0.22],
                "wide",
                "Habitt and the carpenter inside the showroom.",
                ken_burns=True,
            ),
            P(
                "p7-habitt-copy",
                [0.545, 0.605, 0.415, 0.22],
                "detail",
                "Imitation is easy. Originality is intent.",
                "The problem was not furniture. The problem was the consumer's confidence that resemblance is the same as value.",
            ),
            P(
                "p7-bottom",
                [0.04, 0.83, 0.92, 0.12],
                "wide",
                "Strategy is in the sticky thought in the details. If it doesn't finish in behaviour, it only moves markets.",
            ),
        ],
    },
    {
        "id": "behind-the-work",
        "title": "This is the work behind the work",
        "kicker": "Question the reason. Change the result.",
        "page": 8,
        "panels": [
            P(
                "p8-splash",
                FULL,
                "splash",
                "A portfolio can show the campaign. It cannot always show the belief we had to break before the campaign could exist.",
                "A portfolio can show you the advertisement that eventually appeared. It cannot always show you the belief we had to break before that advertisement could exist. And that is usually where the real work was.",
                pin=True,
                ken_burns=True,
            ),
        ],
    },
    {
        "id": "interlude-wait",
        "title": "But wait! Did you notice something?",
        "kicker": "Interlude",
        "page": 9,
        "panels": [
            P(
                "p9-splash",
                FULL,
                "interstitial",
                "Find the belief. Challenge the behaviour. Change the brand's role.",
                pin=True,
                ken_burns=True,
            ),
            P(
                "p9-method",
                [0.38, 0.58, 0.58, 0.18],
                "wide",
                "Observe more. Find the belief. Challenge the behaviour. Change the brand's role.",
            ),
        ],
    },
    {
        "id": "pattern",
        "title": "The pattern in the work",
        "kicker": "These are not neat campaign rectangles. They are beliefs that had to be challenged.",
        "page": 10,
        "panels": [
            P(
                "p10-header",
                [0.04, 0.028, 0.92, 0.14],
                "wide",
                "These are not neat campaign rectangles. They are beliefs that had to be challenged.",
            ),
            P(
                "p10-beliefs-left",
                [0.04, 0.17, 0.28, 0.62],
                "portrait",
                "A biscuit was only about price. Truckers were outsiders. Boiling made loose milk feel as good as packaged.",
            ),
            P(
                "p10-center",
                [0.32, 0.17, 0.36, 0.50],
                "portrait",
                "",
                "I find the belief that makes the behaviour feel reasonable. Then I question it.",
                pin=True,
                ken_burns=True,
            ),
            P(
                "p10-beliefs-right",
                [0.68, 0.17, 0.28, 0.62],
                "portrait",
                "Fertility proved masculinity. A son represented the future more than a daughter. A copied design was the same product for less money.",
            ),
            P(
                "p10-brain",
                [0.04, 0.78, 0.92, 0.18],
                "wide",
                "Then we can talk about the insight, the positioning, the messaging, the creative territories, and the whole shebang.",
            ),
        ],
    },
    {
        "id": "system",
        "title": "When the system did not exist",
        "kicker": "If the infrastructure was missing, I tried to build pieces of it.",
        "page": 11,
        "panels": [
            P(
                "p11-header",
                [0.04, 0.028, 0.92, 0.13],
                "wide",
                "If the infrastructure was missing, I tried to build pieces of it.",
            ),
            P(
                "p11-sandpaper",
                [0.04, 0.155, 0.92, 0.22],
                "wide",
                "Sandpaper: diagnosis before deliverables. Positioning before campaign lines.",
                ken_burns=True,
            ),
            P(
                "p11-why",
                [0.04, 0.375, 0.92, 0.22],
                "wide",
                "The Why Journey: culture is not a trend report you open when the brief asks for Gen Z.",
                ken_burns=True,
            ),
            P(
                "p11-youth",
                [0.04, 0.595, 0.92, 0.22],
                "wide",
                "National youth research in a country with a median age of around twenty.",
                ken_burns=True,
            ),
            P(
                "p11-quote",
                [0.04, 0.82, 0.92, 0.14],
                "wide",
                "I chose the second one.",
                "When the research infrastructure you need does not exist, you can keep complaining about the absence of data. Or you can begin building the understanding yourself.",
                pin=True,
            ),
        ],
    },
    {
        "id": "upstream",
        "title": "What I expect strategy to do",
        "kicker": "Not a funnel mechanic. Not a content calendar with a pulse. Upstream strategy.",
        "page": 12,
        "panels": [
            P(
                "p12-header",
                [0.04, 0.028, 0.92, 0.13],
                "wide",
                "The strategy I care about begins upstream.",
            ),
            P(
                "p12-1",
                [0.04, 0.16, 0.33, 0.155],
                "detail",
                "1. Take the brief apart.",
            ),
            P(
                "p12-2",
                [0.37, 0.16, 0.33, 0.155],
                "detail",
                "2. Find the real challenge beneath the stated ask.",
            ),
            P(
                "p12-brief-not",
                [0.70, 0.16, 0.26, 0.32],
                "portrait",
                "This is not the problem. This is just the problem you are comfortable admitting.",
            ),
            P(
                "p12-3",
                [0.04, 0.315, 0.33, 0.155],
                "detail",
                "3. Understand the business, the audience, the market, the competition, and the culture.",
            ),
            P(
                "p12-4",
                [0.37, 0.315, 0.33, 0.155],
                "detail",
                "4. Find the tension. Make a choice.",
            ),
            P(
                "p12-5",
                [0.04, 0.47, 0.33, 0.155],
                "detail",
                "5. Build the positioning and messaging.",
            ),
            P(
                "p12-6",
                [0.37, 0.47, 0.33, 0.155],
                "detail",
                "6. Define creative territories sharp enough to guide and open enough to inspire.",
            ),
            P(
                "p12-7",
                [0.04, 0.625, 0.33, 0.155],
                "detail",
                "7. Structure the story so the thinking lands in the room.",
            ),
            P(
                "p12-8",
                [0.37, 0.625, 0.33, 0.155],
                "detail",
                "8. Stay close to the work while it changes shape.",
            ),
            P(
                "p12-research",
                [0.70, 0.48, 0.26, 0.30],
                "portrait",
                "Research is useful when it changes the decision. I want the tension that changes the brief.",
            ),
            P(
                "p12-quote",
                [0.04, 0.82, 0.92, 0.14],
                "wide",
                "",
                "Strategy becomes useful when it reduces the number of equally attractive wrong answers.",
                pin=True,
            ),
        ],
    },
    {
        "id": "vintage",
        "title": "Vintage classics from early strategy days",
        "kicker": "Old decks. Same brain.",
        "page": 13,
        "panels": [
            P(
                "p13-splash",
                FULL,
                "interstitial",
                "The decks were longer. The instincts were younger. The problem was still the problem.",
                pin=True,
                ken_burns=True,
            ),
        ],
    },
    {
        "id": "tiger-deep",
        "title": "Tiger and the right to remain a child",
        "kicker": "When the world gets heavy, childhood is the thing worth protecting.",
        "page": 14,
        "panels": [
            P(
                "p14-header",
                [0.04, 0.028, 0.92, 0.12],
                "wide",
                "When the world gets heavy, childhood is the thing worth protecting.",
            ),
            P(
                "p14-country",
                [0.04, 0.145, 0.30, 0.16],
                "detail",
                "1. The country had become heavier.",
            ),
            P(
                "p14-parents",
                [0.345, 0.145, 0.30, 0.16],
                "detail",
                "2. Parents responded by making childhood heavier too.",
            ),
            P(
                "p14-kids",
                [0.65, 0.145, 0.31, 0.16],
                "detail",
                "3. Children were exposed to adult worries — too soon.",
            ),
            P(
                "p14-staple",
                [0.04, 0.31, 0.30, 0.16],
                "detail",
                "Tiger was a basic staple. Useful? Yes. But not enough to earn love today.",
            ),
            P(
                "p14-not-nutrition",
                [0.345, 0.31, 0.30, 0.16],
                "detail",
                "Tiger did not need another nutrition story.",
            ),
            P(
                "p14-realisation",
                [0.65, 0.31, 0.31, 0.16],
                "detail",
                "Usefulness is already too crowded. That is the problem.",
            ),
            P(
                "p14-bachpan",
                [0.04, 0.475, 0.30, 0.20],
                "detail",
                "The new idea: Bachpan Mubarak. Celebrate childhood.",
                ken_burns=True,
            ),
            P(
                "p14-role",
                [0.345, 0.475, 0.615, 0.20],
                "wide",
                "Old role: quantity and energy. New role: defend childhood.",
            ),
            P(
                "p14-play",
                [0.04, 0.68, 0.92, 0.145],
                "wide",
                "Parents, let children be children.",
                ken_burns=True,
            ),
            P(
                "p14-quote",
                [0.04, 0.825, 0.92, 0.13],
                "wide",
                "A biscuit brand stopped selling quantity. It started standing up for childhood.",
                "Do not make childhood useful. Protect it.",
                pin=True,
            ),
        ],
    },
    {
        "id": "encore",
        "title": "How about one more?",
        "kicker": "Encore",
        "page": 15,
        "panels": [
            P(
                "p15-splash",
                FULL,
                "interstitial",
                "This is what happens when a strategist refuses to shut up.",
                pin=True,
                ken_burns=True,
            ),
        ],
    },
    {
        "id": "olpers-deep",
        "title": "Olper's and the boiling pot",
        "kicker": "The real competitor was not another carton. It was a behaviour sitting on the stove.",
        "page": 16,
        "panels": [
            P(
                "p16-header",
                [0.04, 0.028, 0.92, 0.12],
                "wide",
                "The real competitor was not another carton. It was a behaviour sitting on the stove.",
            ),
            P(
                "p16-milkman",
                [0.04, 0.145, 0.30, 0.20],
                "detail",
                "The milkman knew your gate.",
            ),
            P(
                "p16-trust",
                [0.345, 0.145, 0.30, 0.20],
                "detail",
                "Trust does not always wait for proof.",
            ),
            P(
                "p16-stove",
                [0.65, 0.145, 0.31, 0.20],
                "detail",
                "The real barrier was sitting on the stove.",
            ),
            P(
                "p16-science",
                [0.04, 0.35, 0.30, 0.16],
                "detail",
                "Our answer: packaged milk built on science.",
            ),
            P(
                "p16-process",
                [0.345, 0.35, 0.36, 0.16],
                "detail",
                "The controlled UHT process. No boiling needed.",
            ),
            P(
                "p16-we-boil",
                [0.71, 0.35, 0.25, 0.16],
                "detail",
                "The rationalisation in one line: we boil it.",
            ),
            P(
                "p16-attack",
                [0.04, 0.52, 0.62, 0.20],
                "wide",
                "You boil, you spoil.",
                "If boiling becomes the stigma, the loose milk habit starts to crack.",
                pin=True,
                ken_burns=True,
            ),
            P(
                "p16-vs",
                [0.66, 0.52, 0.30, 0.20],
                "detail",
                "Loose vs. controlled. The barrier was not availability. It was justification.",
            ),
            P(
                "p16-habit",
                [0.04, 0.725, 0.50, 0.12],
                "wide",
                "From this habit, to this carton, to this family, to this new normal.",
            ),
            P(
                "p16-quote",
                [0.04, 0.85, 0.92, 0.11],
                "wide",
                "",
                "The competitor was not the carton beside us. It was the boiling pot inside the kitchen.",
                pin=True,
            ),
        ],
    },
    {
        "id": "one-last",
        "title": "Okay, just one last.",
        "kicker": "Because some stories deserve their moment.",
        "page": 17,
        "panels": [
            P(
                "p17-splash",
                FULL,
                "interstitial",
                "Sometimes it's not just about fixing a company. It's about restoring a nation's belief in itself.",
                pin=True,
                ken_burns=True,
            ),
        ],
    },
    {
        "id": "hbl",
        "title": "HBL and every dream counts",
        "kicker": "When a bank for the people started feeling far away from the people",
        "page": 18,
        "panels": [
            P(
                "p18-header",
                [0.04, 0.028, 0.92, 0.14],
                "wide",
                "Jahan khwab, wahan HBL. Wherever there is a dream, there is HBL.",
            ),
            P(
                "p18-legacy",
                [0.04, 0.17, 0.48, 0.18],
                "grid-beat",
                "1. A legacy of trust. A bank of the masses.",
            ),
            P(
                "p18-drift",
                [0.52, 0.17, 0.44, 0.18],
                "grid-beat",
                "2. The problem: we drifted. We were celebrating dreams people didn't feel seen in.",
            ),
            P(
                "p18-listen",
                [0.04, 0.355, 0.92, 0.20],
                "wide",
                "3. We listened across Pakistan. Big cities. Small towns. Every place.",
                ken_burns=True,
            ),
            P(
                "p18-insight",
                [0.04, 0.56, 0.22, 0.22],
                "detail",
                "Dreams do not have to be grand to be life changing. They have to be real.",
            ),
            P(
                "p18-role",
                [0.26, 0.56, 0.28, 0.22],
                "detail",
                "I brought back the human stories. I reframed the brief.",
            ),
            P(
                "p18-shift",
                [0.545, 0.56, 0.415, 0.22],
                "wide",
                "The campaign. The platform. Every Dream Counts.",
                ken_burns=True,
            ),
            P(
                "p18-quote",
                [0.04, 0.79, 0.92, 0.16],
                "wide",
                "",
                "The job was not to make dreams bigger. It was to make the bank feel closer to the dreams people already had.",
                pin=True,
            ),
        ],
    },
    {
        "id": "colophon",
        "title": "There is more.",
        "kicker": "This portfolio is just a glimpse.",
        "page": 19,
        "panels": [
            P(
                "p19-splash",
                FULL,
                "splash",
                "Portfolios tell you what I made. Conversations reveal why.",
                "Judging a strategist from a portfolio is a bit like judging wine from the label without opening the bottle.",
                pin=True,
                ken_burns=True,
            ),
            P(
                "p19-thanks",
                [0.04, 0.82, 0.92, 0.14],
                "wide",
                "For scrolling, reading, and sticking around. Hope to see you soon.",
            ),
        ],
    },
]


def clamp_box(box: list[float], page_w: int, page_h: int) -> tuple[int, int, int, int]:
    l, t, w, h = box
    x0 = max(0, int(l * page_w))
    y0 = max(0, int(t * page_h))
    x1 = min(page_w, int((l + w) * page_w))
    y1 = min(page_h, int((t + h) * page_h))
    if x1 <= x0:
        x1 = min(page_w, x0 + 1)
    if y1 <= y0:
        y1 = min(page_h, y0 + 1)
    return x0, y0, x1, y1


def fit_max_edge(im: Image.Image, max_edge: int) -> Image.Image:
    w, h = im.size
    longest = max(w, h)
    if longest <= max_edge:
        return im
    scale = max_edge / longest
    return im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def save_webp(im: Image.Image, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = im.convert("RGB")
    rgb.save(path, "WEBP", quality=quality, method=6)


def tiny_thumb(im: Image.Image) -> Image.Image:
    w, h = im.size
    tw = THUMB_WIDTH
    th = max(1, int(h * (tw / w)))
    return im.resize((tw, th), Image.Resampling.LANCZOS)


def main() -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    THUMBS.mkdir(parents=True, exist_ok=True)
    PAGES.mkdir(parents=True, exist_ok=True)
    CONTENT.parent.mkdir(parents=True, exist_ok=True)

    doc = pymupdf.open(PDF)
    zoom = DPI / 72
    matrix = pymupdf.Matrix(zoom, zoom)
    page_images: dict[int, Image.Image] = {}

    needed = {ch["page"] for ch in CHAPTERS}
    for i in needed:
        page = doc[i - 1]
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        page_images[i] = im
        print(f"raster {i:02d}: {im.size}")

    doc.close()

    issue_chapters = []
    frame_index = 0

    page_files: dict[int, dict] = {}
    for page_no, src in page_images.items():
        page_web = fit_max_edge(src, MAX_PAGE_EDGE)
        page_name = f"page-{page_no:02d}.webp"
        save_webp(page_web, PAGES / page_name, WEBP_QUALITY)
        page_files[page_no] = {
            "src": f"/pages/{page_name}",
            "width": page_web.size[0],
            "height": page_web.size[1],
        }
        print(f"page {page_name} {page_web.size}")

    for chapter in CHAPTERS:
        page_no = chapter["page"]
        src = page_images[page_no]
        pw, ph = src.size
        page_meta = page_files[page_no]
        out_panels = []
        for panel in chapter["panels"]:
            frame_index += 1
            x0, y0, x1, y1 = clamp_box(panel["box"], pw, ph)
            crop = src.crop((x0, y0, x1, y1))
            web = fit_max_edge(crop, MAX_EDGE)
            thumb = tiny_thumb(crop)
            fname = f"{frame_index:03d}-{panel['id']}.webp"
            save_webp(web, FRAMES / fname, WEBP_QUALITY)
            save_webp(thumb, THUMBS / fname, 72)
            l, t, w, h = panel["box"]
            out_panels.append(
                {
                    "id": panel["id"],
                    "src": f"/frames/{fname}",
                    "thumb": f"/thumbs/{fname}",
                    "role": panel["role"],
                    "caption": panel["caption"],
                    "quote": panel["quote"],
                    "pin": panel["pin"],
                    "kenBurns": panel["kenBurns"],
                    "width": web.size[0],
                    "height": web.size[1],
                    "page": page_no,
                    "pageSrc": page_meta["src"],
                    "box": [round(l, 4), round(t, 4), round(w, 4), round(h, 4)],
                    "frame": frame_index,
                }
            )
            print(f"  {fname} {web.size}")
        issue_chapters.append(
            {
                "id": chapter["id"],
                "title": chapter["title"],
                "kicker": chapter["kicker"],
                "page": page_no,
                "pageSrc": page_meta["src"],
                "pageWidth": page_meta["width"],
                "pageHeight": page_meta["height"],
                "panels": out_panels,
            }
        )

    issue = {
        "title": "Oops, I Don't Have a Portfolio.",
        "subtitle": "An argument for the work behind the work",
        "author": "Salman Ali",
        "role": "Senior Strategist",
        "location": "Sydney · Australian Permanent Resident",
        "masthead": "Issue 01",
        "tagline": "Strategist. Storyteller. Belief breaker.",
        "cta": {
            "label": "If this got you curious, let's talk.",
            "line": "Portfolios tell you what I made. Conversations reveal why.",
        },
        "chapters": issue_chapters,
        "totalFrames": frame_index,
    }
    CONTENT.write_text(json.dumps(issue, indent=2), encoding="utf-8")
    print(f"wrote {CONTENT} with {frame_index} frames")


if __name__ == "__main__":
    main()
