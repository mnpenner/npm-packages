#!/usr/bin/env -S bun
import {
    Checkbox,
    ColorInput,
    DateInput,
    EmailInput,
    FileInput,
    HtmlDocument,
    NumberInput,
    PasswordInput, RadioButton, SearchInput, TelephoneInput, TimeInput, UrlInput, WeekInput
} from '../custom'
import {css, js} from '../template-strings'
import Path from 'path'

const tagLine = 'Kitchen Sink'
const user = {name: 'Ada', id: 'u-1'}
const items = ['alpha', 'beta', 'gamma']

export const kitchenSink = (
    <HtmlDocument lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="description" content="Showcase of HTML elements and attributes" />
            <base href="/" />
            <title>{tagLine}</title>
            <link rel="stylesheet" href="/kitchen-sink.css" media="all" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link rel="icon" type="image/png" href="/static/favicon-96x96.png" sizes="96x96" />
            <link rel="icon" type="image/png" href="/static/favicon-multi.png" sizes="64x64 96X96" />
            <link rel="icon" type="image/png" href="/static/favicon-any.png" sizes="any" />
            <link rel="preload" as="image" href="/hero.jpg" fetchpriority="high" />
            <style>{css`
                body {
                    font-family: ui-sans-serif, system-ui, sans-serif;
                    padding: 24px;
                }

                .box {
                    border: 1px solid #ccc;
                    padding: 12px;
                }
            `}</style>
            <script defer src="/kitchen-sink.js"></script>
        </head>
        <body id="kitchen" class="box" title="Kitchen Sink" translate="yes" spellcheck="true">
            <header class="box" role="banner">
                <h1>{tagLine}</h1>
                <p>
                    <a
                        href="/docs"
                        hreflang="en"
                        rel="noopener"
                        target="_blank"
                        referrerpolicy="no-referrer"
                        ping="/ping"
                    >
                        Read the docs
                    </a>
                </p>
            </header>

            <nav class="box" aria-label="Primary" tabindex={0}>
                <ul>
                    <li><a href="#forms">Forms</a></li>
                    <li><a href="#media">Media</a></li>
                    <li><a href="#tables">Tables</a></li>
                </ul>
            </nav>

            <main class="box" id="main" data-user={user.id}>
                <section id="forms" class="box">
                    <h2>Forms</h2>
                    <form action="/submit" method="post" enctype="multipart/form-data" autocomplete="on">
                        <fieldset>
                            <legend>Profile</legend>
                            <label for="name">Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Ada Lovelace"
                                required
                                minlength={2}
                                maxlength={64}
                                autocapitalize="words"
                                autocorrect="off"
                                writingsuggestions="false"
                                enterkeyhint="next"
                                inputmode="text"
                            />
                            <label for="email">Email</label>
                            <input id="email" name="email" type="email" autocomplete="email" />
                            <label for="age">Age</label>
                            <input id="age" name="age" type="number" min="0" max="120" step="1" />
                            <label for="avatar">Avatar</label>
                            <input id="avatar" name="avatar" type="file" accept="image/*" capture="user" />
                            <label for="color">Favorite color</label>
                            <input id="color" name="color" type="color" value="#ff00aa" />
                            <label for="bio">Bio</label>
                            <textarea id="bio" name="bio" rows="4" cols="40" placeholder="Tell us something..."></textarea>
                        </fieldset>

                        <fieldset>
                            <legend>Preferences</legend>
                            <label>
                            <input type="checkbox" name="subscribe" checked /> Subscribe
                            </label>
                            <label>
                                <input type="radio" name="plan" value="basic" checked /> Basic
                            </label>
                            <label>
                                <input type="radio" name="plan" value="pro" /> Pro
                            </label>
                            <label for="country">Country</label>
                            <select id="country" name="country">
                                <option value="us">United States</option>
                                <option value="ca">Canada</option>
                                <option value="gb">United Kingdom</option>
                            </select>
                        </fieldset>

                        <button type="submit" value="submit">Submit</button>
                        <button type="reset">Reset</button>
                    </form>
                </section>

                <section id="media" class="box">
                    <h2>Media</h2>
                    <figure>
                        <picture>
                            <source srcset="/hero.avif" type="image/avif" />
                            <source srcset="/hero.webp" type="image/webp" />
                            <img
                                src="/hero.jpg"
                                alt="Hero"
                                width="640"
                                height="360"
                                loading="lazy"
                                decoding="async"
                                fetchpriority="low"
                                referrerpolicy="no-referrer"
                            />
                        </picture>
                        <figcaption>Responsive image</figcaption>
                    </figure>

                    <video controls width="320" height={180} poster="/poster.jpg" preload="metadata">
                        <source src="/clip.mp4" type="video/mp4" />
                        <track kind="captions" src="/captions.vtt" srclang="en" label="English" />
                    </video>

                    <audio controls preload="none">
                        <source src="/audio.mp3" type="audio/mpeg" />
                    </audio>

                    <iframe
                        title="Map"
                        src="/map"
                        width={320}
                        height="180"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                    ></iframe>

                    <canvas width="240" height={120n}></canvas>
                </section>

                <section id="tables" class="box">
                    <h2>Tables</h2>
                    <table>
                        <caption>Scores</caption>
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr>
                                    <td>{item}</td>
                                    <td>{i + 1}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section class="box" aria-live="polite">
                    <h2>Text</h2>
                    <p>
                        <strong>Bold</strong>, <em>emphasis</em>, <mark>highlight</mark>, <code>code</code>,
                        <kbd>Cmd</kbd>, <samp>output</samp>, <var>x</var>, and <small>small text</small>.
                    </p>
                    <blockquote cite="/quote">
                        <p>We can only see a short distance ahead.</p>
                    </blockquote>
                    <pre>const answer = 42</pre>
                </section>

                <section>
                    <h2>Custom Inputs</h2>
                    <Checkbox checked/>
                    <ColorInput/>
                    <DateInput/>
                    <EmailInput/>
                    <FileInput/>
                    <NumberInput/>
                    <PasswordInput/>
                    <RadioButton/>
                    <SearchInput/>
                    <TelephoneInput/>
                    <TimeInput/>
                    <UrlInput/>
                    <WeekInput/>
                </section>
            </main>

            <aside class="box" role="complementary">
                <details open>
                    <summary>More info</summary>
                    <p contenteditable="true">Editable note.</p>
                </details>
            </aside>

            <footer class="box" aria-label="Footer">
                <p>&copy; 2026</p>
            </footer>
        </body>
    </HtmlDocument>
)

if(import.meta.main) {
    const html = kitchenSink.toString()
    console.log(html)
    const outputFile = Path.normalize(`${__dirname}/../dist/kitchen-sink.html`)
    await Bun.write(outputFile, html)
    console.log(`Wrote ${outputFile}`)
}
