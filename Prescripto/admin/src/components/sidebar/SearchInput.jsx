import { useState } from "react";
import { Search } from "lucide-react";
import useConversation from "../../zustand/useConversation";
import useGetConversations from "../../hooks/useGetConversations";
import toast from "react-hot-toast";

const SearchInput = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const { setSelectedConversation } = useConversation();
    const { conversations } = useGetConversations();

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) return;

        setIsSearching(true);

        setTimeout(() => {
            const results = conversations.filter((c) =>
                c.name.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(results);
            setIsSearching(false);
            if (results.length === 0) {
                toast.error(`No results found for "${query}"`);
            }
        }, 500);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setSearchQuery("");
        setSearchResults([]);
    };

    return (
        <div className="py-3 border-t border-gray-200 bg-white w-full">
            {/* Search Input */}
            <div className="flex items-center gap-2 w-full">
                <div className="flex-1 flex items-center bg-gray-50 rounded-full px-3 py-2 border border-gray-200 focus-within:border-blue-300 focus-within:bg-white transition-all">
                    <input
                        type="text"
                        placeholder="Find conversation..."
                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    className={`
                        p-2.5 rounded-full transition-all duration-200 flex-shrink-0
                        ${searchQuery.trim() && !isSearching
                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }
                    `}
                >
                    {isSearching ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 shadow-sm w-full">
                    <div className="flex justify-between items-center py-1 border-b border-gray-100 px-2">
                        <span className="text-xs font-medium text-gray-700">
                            Results ({searchResults.length})
                        </span>
                        <button
                            onClick={clearSearch}
                            className="text-xs text-blue-500 hover:text-blue-700"
                        >
                            Clear
                        </button>
                    </div>
                    <div>
                        {searchResults.map((conversation) => (
                            <div
                                key={conversation._id}
                                className="px-2 py-1 hover:bg-gray-50 cursor-pointer text-sm"
                                onClick={() => handleSelectConversation(conversation)}
                            >
                                {conversation.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                <div className="mt-3 text-center text-gray-500 text-sm py-2">
                    No results found for "{searchQuery.trim()}"
                </div>
            )}
        </div>
    );
};

export default SearchInput;