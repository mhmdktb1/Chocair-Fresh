import { Search } from "lucide-react";

function NavSearch({ placeholder }) {
  return (
    <form className="nav-search" role="search" id="navSearchForm">
      <Search className="search-icon" />
      <input type="search" id="navSearchInput" placeholder={placeholder} readOnly />
      <button type="submit">Search</button>
    </form>
  );
}
export default NavSearch;
