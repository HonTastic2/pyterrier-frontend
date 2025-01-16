import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import App from "./App";
import axios from "axios";
jest.mock("axios");

// test("calls API to fetch search results", async () => {
//   axios.get.mockResolvedValue({ data: { result: ["1", "Title", "http://example.com"] } });

//   render(<App />);
//   userEvent.click(screen.getByText(/Search/i));

//   await waitFor(() => {
//     const tabs = screen.getAllByRole('tab');
//     expect(tabs.length).toBeGreaterThan(0);
//   });
  
// //   const tab = await screen.findByText("Table/Link Articles");
// //   userEvent.click(tab);
//     const tabs = screen.getAllByRole('tab');

// // Click on the second tab
//     fireEvent.click(tabs[1]);

//   const title = await screen.findByText("Title");
//   expect(title).toBeInTheDocument();
// });

test("handles API error gracefully", async () => {
  axios.post.mockRejectedValueOnce(new Error("API Error"));

  render(<App />);
  fireEvent.click(screen.getByText(/Search/i));

  await screen.findByText(/Error getting links!/i);
});

test("renders the input page by default", () => {
    render(<App />);
    expect(screen.getByText(/Enter article contents:/i)).toBeInTheDocument();
});

test("updates inputText on textarea change", () => {
    render(<App />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Test input" } });
    expect(textarea.value).toBe("Test input");
});

test("updates numResults on dropdown change", () => {
    render(<App />);
    const dropdown = screen.getByRole("combobox");
    fireEvent.change(dropdown, { target: { value: "3" } });
    expect(dropdown.value).toBe("3");
});

// test("calls handleSearch on clicking Search", () => {
//     render(<App />);
//     const searchButton = screen.getByText(/Search/i);
//     fireEvent.click(searchButton);
//     expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
// });

test("calls goBack on clicking Back", () => {
    render(<App />);
    const backButton = screen.getByText(/Back/i);
    fireEvent.click(backButton);
    expect(screen.getByText(/Enter article contents:/i)).toBeInTheDocument();
});



