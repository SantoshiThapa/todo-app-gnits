import { useEffect, useState } from "react";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "./api";
import { FILTERS } from "./constants";
import Sidebar from "./components/Sidebar";
import TodoForm from "./components/TodoForm";
import TodoItem from "./components/TodoItem";

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const run = async (fn) => {
    try {
      setError("");
      await fn();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    run(async () => {
      const data = await getTodos();
      setTodos(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = (title) =>
    run(async () => {
      const created = await createTodo(title);
      setTodos((prev) => [created, ...prev]);
      setCurrentPage(1);
    });

  const handleUpdate = (id, data) =>
    run(async () => {
      const updated = await updateTodo(id, data);
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? updated : t))
      );
    });

  const handleDelete = (id) =>
    run(async () => {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    });

  const handleClearDone = () =>
    run(async () => {
      const completedTodos = todos.filter((t) => t.completed);

      await Promise.all(
        completedTodos.map((t) => deleteTodo(t._id))
      );

      setTodos((prev) => prev.filter((t) => !t.completed));
      setCurrentPage(1);
    });

  const filteredTodos = todos.filter((todo) => {
    if (filter === FILTERS.ACTIVE) {
      return !todo.completed;
    }

    if (filter === FILTERS.DONE) {
      return todo.completed;
    }

    return true;
  });

  const totalPages = Math.ceil(
    filteredTodos.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedTodos = filteredTodos.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="app">
      <Sidebar
        filter={filter}
        setFilter={handleFilterChange}
        todos={todos}
        onClearDone={handleClearDone}
      />

      <main className="main">
        <TodoForm onAdd={handleAdd} />

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="todo-list">
              {paginatedTodos.length === 0 ? (
                <p>No todos found.</p>
              ) : (
                paginatedTodos.map((todo) => (
                  <TodoItem
                    key={todo._id}
                    todo={todo}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>

            <div className="pagination">
              <div className="items-per-page">
                <label>Items per page: </label>

                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="pagination-controls">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => page - 1)
                  }
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    className={
                      currentPage === page
                        ? "active"
                        : ""
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={
                    currentPage === totalPages ||
                    totalPages === 0
                  }
                  onClick={() =>
                    setCurrentPage((page) => page + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;