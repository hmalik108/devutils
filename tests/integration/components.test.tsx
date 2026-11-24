import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/tools",
  useSearchParams: () => search,
}));

import { ToolSearch } from "@/components/tools/tool-search";
import { ToolDirectory } from "@/components/tools/tool-directory";
import { CopyButton } from "@/components/tools/copy-button";
import { StatusMessage } from "@/components/tools/status-message";
import Base64Tool from "@/components/tool-ui/base64";
import UrlEncoderTool from "@/components/tool-ui/url-encoder";
import UuidGeneratorTool from "@/components/tool-ui/uuid-generator";

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  search = new URLSearchParams();
});

describe("ToolSearch", () => {
  it("shows ranked results and navigates with the keyboard", async () => {
    const user = userEvent.setup();
    render(<ToolSearch />);
    const box = screen.getByRole("combobox", { name: "Search tools" });
    await user.type(box, "jwt");
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option")[0]).toHaveTextContent("JWT Decoder");
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/jwt-decoder");
  });

  it("shows an empty state", async () => {
    const user = userEvent.setup();
    render(<ToolSearch />);
    await user.type(screen.getByRole("combobox"), "qwertyuiop");
    expect(screen.getByText(/No tools match/)).toBeInTheDocument();
  });
});

describe("ToolDirectory", () => {
  it("filters by category and syncs the URL", async () => {
    const user = userEvent.setup();
    render(<ToolDirectory />);
    await user.click(screen.getByRole("button", { name: "DevOps Tools" }));
    expect(screen.getByRole("link", { name: /Cron Expression Generator/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /JWT Decoder/ })).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/tools?category=devops", { scroll: false });
  });

  it("reads the initial query from the URL", () => {
    search = new URLSearchParams("q=base64");
    render(<ToolDirectory />);
    expect(screen.getByRole("link", { name: /Base64 Encoder/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Regex Tester/ })).not.toBeInTheDocument();
  });
});

describe("CopyButton", () => {
  it("copies to the clipboard and confirms", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<CopyButton value="hello" />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});

describe("StatusMessage", () => {
  it("announces errors and does not rely on colour alone", () => {
    render(<StatusMessage kind="error" title="Bad input" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Error: Bad input");
  });
});

describe("Base64 tool", () => {
  it("encodes, swaps and decodes", async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.type(screen.getByLabelText("Text to encode"), "hi ✓");
    expect(screen.getByLabelText("Base64 output")).toHaveValue("aGkg4pyT");
    await user.click(screen.getByRole("button", { name: "Swap" }));
    expect(screen.getByRole("radio", { name: "Decode" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Decoded text")).toHaveValue("hi ✓");
  });

  it("shows an accessible error for invalid input", async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.click(screen.getByRole("radio", { name: "Decode" }));
    await user.type(screen.getByLabelText("Base64 to decode"), "@@");
    expect(screen.getByRole("alert")).toHaveTextContent(/Invalid character/);
    expect(screen.getByLabelText("Base64 to decode")).toHaveAttribute("aria-invalid", "true");
  });

  it("clears input", async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.click(screen.getByRole("button", { name: "Sample" }));
    expect(screen.getByLabelText("Text to encode")).not.toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Text to encode")).toHaveValue("");
  });
});

describe("URL encoder tool", () => {
  it("decodes form data with + as space", async () => {
    const user = userEvent.setup();
    render(<UrlEncoderTool />);
    await user.click(screen.getByRole("radio", { name: "Decode" }));
    await user.click(screen.getByLabelText("Treat + as space"));
    await user.type(screen.getByLabelText("Encoded text to decode"), "a+b%21");
    expect(screen.getByLabelText("Decoded output")).toHaveValue("a b!");
  });
});

describe("UUID tool", () => {
  it("generates, validates quantity and downloads", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:x");
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<UuidGeneratorTool />);
    const qty = screen.getByLabelText("Quantity");
    await user.clear(qty);
    await user.type(qty, "0");
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/from 1 to 1,000/);
    await user.clear(qty);
    await user.type(qty, "4");
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByTestId("uuid")).toHaveLength(4);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Download" }));
    });
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });
});
