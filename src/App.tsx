/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { deleteTodo, getTodos, postTodo, USER_ID } from './api/todos';
import { TodoList } from './components/TodoList';
import { Todo } from './types/Todo';
import cn from 'classnames';
import { TodoStatus } from './types/TodoStatus';

function getFilteredTodos(
  todos: Todo[],
  { status }: { status: TodoStatus },
): Todo[] {
  let filteredTodos = [...todos];

  if (status === TodoStatus.Active) {
    filteredTodos = filteredTodos.filter(todo => todo.completed === false);
  } else if (status === TodoStatus.Completed) {
    filteredTodos = filteredTodos.filter(todo => todo.completed === true);
  }

  return filteredTodos;
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState(TodoStatus.All);
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);
  const [todoTitle, setTodoTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [loadingTodos, setLoadingTodos] = useState<Todo['id'][]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  function hideErrorMessage() {
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  }

  useEffect(() => {
    inputRef.current?.focus();
    getTodos()
      .then(todosFromServer => {
        setTodos(todosFromServer);
        setCompletedTodos(
          todosFromServer.filter(todo => todo.completed === true),
        );
      })
      .catch(() => {
        setErrorMessage('Unable to load todos');
        hideErrorMessage();
      });
  }, []);

  const handleStatusAll = () => {
    setStatus(TodoStatus.All);
  };

  const handleStatusActive = () => {
    setStatus(TodoStatus.Active);
  };

  const handleStatusComplete = () => {
    setStatus(TodoStatus.Completed);
  };

  const handleSetTodoTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTodoTitle(event.target.value.trimStart());
    setErrorMessage('');
  };

  useEffect(() => {
    if (!isDisabled) {
      inputRef.current?.focus();
    }
  }, [isDisabled]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (todoTitle === '') {
      setErrorMessage('Title should not be empty');
      hideErrorMessage();
    }

    if (todoTitle !== '') {
      setIsDisabled(true);
      setTempTodo({
        id: 0,
        userId: USER_ID,
        title: todoTitle.trim(),
        completed: false,
      });
      setLoadingTodos(currentIds => [...currentIds, 0]);

      postTodo({
        id: 0,
        userId: USER_ID,
        title: todoTitle.trim(),
        completed: false,
      })
        .then(todo => {
          setTodos(currentTodos => [...currentTodos, todo]);
          setTodoTitle('');
        })
        .catch(() => {
          setErrorMessage('Unable to add a todo');
          hideErrorMessage();
        })
        .finally(() => {
          setLoadingTodos(currentTodos => currentTodos.filter(id => id !== 0));
          setTempTodo(null);
          setIsDisabled(false);
        });
    }
  }

  function handleDeleteTodo(todoId: Todo['id']) {
    setLoadingTodos(currentIds => [...currentIds, todoId]);
    setIsDisabled(true);

    deleteTodo(todoId)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
        hideErrorMessage();
      })
      .finally(() => {
        setIsDisabled(false);
      });
  }

  function handleDeleteCompletedTodo() {
    const completedTodosIds = completedTodos.map(todo => todo.id);

    setIsDisabled(true);

    setLoadingTodos(currentIds => [...currentIds, ...completedTodosIds]);
    Promise.allSettled(
      completedTodos.map(completedtodo =>
        deleteTodo(completedtodo.id)
          .then(() => {
            setTodos(currentTodos =>
              currentTodos.filter(todo => todo.id !== completedtodo.id),
            );
            setCompletedTodos(currentCompletedTodos =>
              currentCompletedTodos.filter(
                todo => todo.id !== completedtodo.id,
              ),
            );
          })
          .catch(() => {
            setErrorMessage('Unable to delete a todo');
            hideErrorMessage();
          })
          .finally(() => {
            setIsDisabled(false);
          }),
      ),
    );
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  const preparedTodos = getFilteredTodos(todos, { status });

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={todoTitle}
              onChange={handleSetTodoTitle}
              disabled={isDisabled}
              ref={inputRef}
            />
          </form>
        </header>

        {todos.length > 0 && (
          <>
            <TodoList
              todos={preparedTodos}
              tempTodo={tempTodo}
              loadingTodos={loadingTodos}
              OnLoadingTodos={setLoadingTodos}
              OnHandleDeleteTodo={handleDeleteTodo}
            />

            <footer className="todoapp__footer" data-cy="Footer">
              <span className="todo-count" data-cy="TodosCounter">
                {todos.length - completedTodos.length} items left
              </span>

              {/* Active link should have the 'selected' class */}
              <nav className="filter" data-cy="Filter">
                <a
                  href="#/"
                  className={cn('filter__link', {
                    selected: status === TodoStatus.All,
                  })}
                  data-cy="FilterLinkAll"
                  onClick={handleStatusAll}
                >
                  All
                </a>

                <a
                  href="#/active"
                  className={cn('filter__link', {
                    selected: status === TodoStatus.Active,
                  })}
                  data-cy="FilterLinkActive"
                  onClick={handleStatusActive}
                >
                  Active
                </a>

                <a
                  href="#/completed"
                  className={cn('filter__link', {
                    selected: status === TodoStatus.Completed,
                  })}
                  data-cy="FilterLinkCompleted"
                  onClick={handleStatusComplete}
                >
                  Completed
                </a>
              </nav>

              {/* this button should be disabled if there are no completed todos */}
              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
                disabled={completedTodos.length <= 0}
                onClick={handleDeleteCompletedTodo}
              >
                Clear completed
              </button>
            </footer>
          </>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: errorMessage === '' },
        )}
      >
        <button data-cy="HideErrorButton" type="button" className="delete" />
        {/* show only one message at a time */}
        {errorMessage}
        {/* <br />
        Title should not be empty
        <br />
        Unable to add a todo
        <br />
        Unable to delete a todo
        <br />
        Unable to update a todo */}
      </div>
    </div>
  );
};
