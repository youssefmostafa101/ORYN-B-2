# Simplified coming-soon verification

Local result: 11 browser checks and 4 server/database tests passed, with zero page errors and zero reported automated accessibility violations at all five tested widths.

The current brief replaces the 3D/cart/scratch experience with the original-photo, opt-in-only page. Automated checks cover 320, 390, 768, 1024 and 1440px; body overflow; hero-copy/photo separation; unfiltered, normally blended product photos at their original aspect ratio; no old 3D/generated asset loads; accessibility; ten gallery views; hero switch; gentle motion/pause/reduced motion; notify links; actual local signup persistence/removal; consent errors and server failures.

Server tests use the generated real SQLite schema and cover consent/input validation, duplicate addresses, removal-token hashing, deletion, same-origin requests, payload/type/method rejection, rate limiting and database failure. Local signup records are temporary test records. The hosted version uses persistent D1.

Desktop/mobile screenshots are visually reviewed for hierarchy, original photo color, product sizing, spacing and layout. Browser-sized checks do not claim physical-device certification. The original live baseline remains `6a122eb5f43c6ec97b26dcfcfcc583d0b5218ae3`.
