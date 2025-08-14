# marchat-webui

A standalone web-based graphical user interface prototype built in plain HTML, CSS, and JavaScript to demonstrate a possible graphical client for marchat.

---

## Overview

This project is an experimental proof-of-concept of a graphical chat client UI for marchat. It provides a lightweight, responsive interface for users who are not comfortable with the terminal. The UI demonstrates that marchat can support custom frontends while keeping the core server minimal and terminal-focused.

**Important:**
This GUI is **not part of the official marchat codebase** and does **not** represent an official or planned release. It is provided solely for private testing, experimentation, or internal use and may never be integrated or maintained as part of marchat.

---

## Features

* Connect to a marchat WebSocket server
* Show online users and connection status
* Send and receive chat messages and commands
* Responsive UI
* Minimal footprint (approx. 17 KB)

---

## Screenshots

<table>
  <tr>
    <td><img src="marchat-webui-login.jpg" alt="marchat web UI login" width="400" style="max-width:100%;height:auto;"></td>
    <td><img src="marchat-webui-client.jpg" alt="marchat web UI chat" width="400" style="max-width:100%;height:auto;"></td>
  </tr>
</table>

---

## Usage

1. Open `index.html` in a modern web browser.
2. Enter your marchat server WebSocket URL (e.g. `ws://localhost:8080/ws`) and click **Connect**.
3. Enter your username.
4. Type messages or commands (starting with `:`) in the input box.

---

## Purpose

This web UI is a minimal proof-of-concept demonstrating that a graphical client can interface with marchat. It allows teams and developers to include non-terminal users in private/self-hosted environments or experiment with custom frontends, while preserving the lightweight, terminal-focused design of the core server.

Even as a demo, it extends marchat's usability beyond terminal users, making self-hosted servers more accessible to collaborators and small teams.

---

## Limitations Note

While this demo does not support advanced features, if you are interested in extending the web UI or creating a custom frontend, feel free to reach out via discussions or email at [cod.e.codes.dev@gmail.com](mailto:cod.e.codes.dev@gmail.com).

---

## Limitations

* No TLS or authentication beyond username.
* Limited feature set: no admin commands, plugins, or E2EE.
* Designed only for private/self-hosted experimentation.
* Not actively maintained.
* Feature parity with the TUI client is not guaranteed.

---

## Disclaimer

* This project is intended only for private or experimental use.
* Functionality depends on a compatible marchat server.
* No official support or warranty is provided.

---

## License

MIT License
See [LICENSE](LICENSE) for details.

---

## Contributions

Contributions are welcome, but note this is an experimental project and may be archived without further development.

---

*marchat’s primary client remains terminal-based; this GUI is an independent experimental interface.*
