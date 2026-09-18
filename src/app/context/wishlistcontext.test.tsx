/**
 * Wishlist add-flow regression tests.
 *
 * Covers the reported "added products disappear / show wrong data" bugs:
 *  1. Guest mode persists adds across reloads.
 *  2. Logged-in mode keeps non-GUID (mock) products: they are persisted
 *     locally and merged with backend rows on every load.
 *  3. Backend status maps to inStock (Active -> true, Inactive -> false).
 *  4. A server 409 rejection reverts the optimistic add (no phantom items).
 *  5. Guest GUID rows are pushed to the backend on login.
 */
import "@testing-library/jest-dom";
import {
  act,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import type { Product } from "@/app/data/products";
import { hasSession } from "@/app/api/api";
import { wishlistApi } from "@/app/api/services";
import {
  WishlistProvider,
  useWishlist,
} from "@/app/context/wishlistcontext";

jest.mock("@/app/api/services", () => ({
  wishlistApi: {
    get: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock("@/app/api/api", () => ({
  hasSession: jest.fn(),
  SESSION_CHANGED_EVENT: "aanzara:session-changed",
}));

const mockedHasSession = hasSession as unknown as jest.Mock;
const mockedGet = wishlistApi.get as unknown as jest.Mock;
const mockedAdd = wishlistApi.add as unknown as jest.Mock;
const mockedRemove = wishlistApi.remove as unknown as jest.Mock;

const GUID_A = "11111111-1111-4111-8111-111111111111";
const GUID_B = "22222222-2222-4222-8222-222222222222";

function makeProduct(
  id: string,
  name: string,
): Product {
  return {
    id,
    name,
    brand: "TestBrand",
    sku: `SKU-${id.slice(0, 4)}`,
    pack: "1pc",
    rating: 4,
    reviews: 10,
    discount: 5,
    mrp: 100,
    price: 95,
    bulkRate: 90,
    bulkMoq: 5,
    moq: 1,
    inStock: true,
    dispatch: "2 days",
    image: "img.png",
    swatch: "#fff",
    accent: "#000",
  } as Product;
}

function Probe() {
  const wishlist = useWishlist();
  return (
    <div>
      <div data-testid="count">{wishlist.totalItems}</div>
      <div data-testid="ids">
        {wishlist.items.map((item) => item.id).join(",")}
      </div>
      <div data-testid="instock">
        {wishlist.items
          .map((item) => `${item.id}:${item.inStock}`)
          .join(",")}
      </div>
      <button
        type="button"
        data-testid="toggle-mock"
        onClick={() =>
          wishlist.toggleWishlist(makeProduct("mock-1", "Mock Item"))
        }
      >
        toggle-mock
      </button>
      <button
        type="button"
        data-testid="toggle-guid"
        onClick={() =>
          wishlist.toggleWishlist(makeProduct(GUID_A, "Real Item"))
        }
      >
        toggle-guid
      </button>
      <button
        type="button"
        data-testid="remove-guid"
        onClick={() => wishlist.removeFromWishlist(GUID_A)}
      >
        remove-guid
      </button>
    </div>
  );
}

async function renderWishlist() {
  let tree: ReturnType<typeof render> | undefined;
  await act(async () => {
    tree = render(
      <WishlistProvider>
        <Probe />
      </WishlistProvider>,
    );
  });
  return tree!;
}

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
  mockedHasSession.mockReturnValue(false);
  mockedGet.mockResolvedValue({ data: [] });
  mockedAdd.mockResolvedValue({ data: null });
  mockedRemove.mockResolvedValue({ data: null });
});

test("guest adds survive reload", async () => {
  const first = await renderWishlist();
  expect(screen.getByTestId("count")).toHaveTextContent("0");

  await act(async () => {
    screen.getByTestId("toggle-mock").click();
  });
  expect(screen.getByTestId("count")).toHaveTextContent("1");
  first.unmount();

  await renderWishlist();
  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("1"),
  );
  expect(screen.getByTestId("ids")).toHaveTextContent("mock-1");
});

test("logged-in mode merges backend rows with local mock products", async () => {
  mockedHasSession.mockReturnValue(true);
  mockedGet.mockResolvedValue({
    data: [
      {
        wishlistItemId: "w1",
        productId: GUID_A,
        productName: "Real Item",
        sku: "SKU-REAL",
        price: 90,
        mrp: 100,
        status: "Active",
      },
      {
        wishlistItemId: "w2",
        productId: GUID_B,
        productName: "Old Item",
        sku: "SKU-OLD",
        price: 50,
        mrp: 50,
        status: "Inactive",
      },
    ],
  });
  window.localStorage.setItem(
    "aanzara_wishlist_v1",
    JSON.stringify([makeProduct("mock-1", "Mock Item")]),
  );

  await renderWishlist();

  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("3"),
  );
  expect(screen.getByTestId("ids")).toHaveTextContent(
    `${GUID_A},${GUID_B},mock-1`,
  );
  // Active -> in stock, Inactive -> out of stock (was always true).
  expect(screen.getByTestId("instock")).toHaveTextContent(
    `${GUID_A}:true,${GUID_B}:false,mock-1:true`,
  );
});

test("server 409 rejection reverts the optimistic add", async () => {
  mockedHasSession.mockReturnValue(true);
  mockedGet.mockResolvedValue({ data: [] });
  mockedAdd.mockRejectedValue({ response: { status: 409 } });

  await renderWishlist();
  await waitFor(() =>
    expect(mockedGet).toHaveBeenCalled(),
  );

  await act(async () => {
    screen.getByTestId("toggle-guid").click();
  });

  // Rejected add is reverted: the item disappears again.
  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("0"),
  );
  expect(mockedAdd).toHaveBeenCalledWith(GUID_A);
});

test("guest GUID rows are pushed on login", async () => {
  mockedHasSession.mockReturnValue(true);
  mockedGet.mockResolvedValue({ data: [] });
  window.localStorage.setItem(
    "aanzara_wishlist_v1",
    JSON.stringify([makeProduct(GUID_A, "Real Item")]),
  );

  await renderWishlist();

  await waitFor(() =>
    expect(mockedAdd).toHaveBeenCalledWith(GUID_A),
  );
});
