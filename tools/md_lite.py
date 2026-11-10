# A small Markdown reader for our own docs: headings, paragraphs, lists, tables, quotes, rules, bold and italics.
import html
import re


def _inline(t):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"\*(.+?)\*", r"<i>\1</i>", t)
    return t


def md(text):
    out, lst, table = [], None, []

    def close_list():
        nonlocal lst
        if lst:
            out.append(f"</{lst}>")
            lst = None

    def close_table():
        rows = [r for r in table if not re.match(r"^\|[-| :]+\|$", r.strip())]
        cells_html = []
        for i, r in enumerate(rows):
            tag = "th" if i == 0 else "td"
            cells = [c.strip() for c in r.strip().strip("|").split("|")]
            cells_html.append("<tr>" + "".join(f"<{tag}>{_inline(c)}</{tag}>" for c in cells) + "</tr>")
        out.append("<table>" + "".join(cells_html) + "</table>")
        table.clear()

    for line in text.replace("\r\n", "\n").split("\n"):
        if line.startswith("|"):
            close_list()
            table.append(line)
            continue
        if table:
            close_table()
        heading = re.match(r"^(#{1,4}) (.*)", line)
        if heading:
            close_list()
            level = min(len(heading.group(1)) + 1, 4)
            out.append(f"<h{level}>{_inline(heading.group(2))}</h{level}>")
        elif re.match(r"^\s*[-*] ", line):
            if lst != "ul":
                close_list()
                out.append("<ul>")
                lst = "ul"
            item = re.sub(r"^\s*[-*] ", "", line)
            out.append(f"<li>{_inline(item)}</li>")
        elif re.match(r"^\d+\. ", line):
            if lst != "ol":
                close_list()
                out.append("<ol>")
                lst = "ol"
            item = re.sub(r"^\d+\. ", "", line)
            out.append(f"<li>{_inline(item)}</li>")
        elif line.strip().startswith(">"):
            close_list()
            out.append(f"<blockquote>{_inline(line.strip().lstrip('> '))}</blockquote>")
        elif line.strip() == "---":
            close_list()
            out.append("<hr>")
        elif line.strip():
            if lst and line.startswith("   "):
                out.append(f"<p>{_inline(line.strip())}</p>")
                continue
            close_list()
            out.append(f"<p>{_inline(line.strip())}</p>")
    close_list()
    if table:
        close_table()
    return "".join(out)
