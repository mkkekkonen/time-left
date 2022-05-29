import getDay from 'date-fns/getDay';
import isBefore from 'date-fns/isBefore';
import isAfter from 'date-fns/isAfter';
import parse from 'date-fns/parse';
import subMinutes from 'date-fns/subMinutes';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import areIntervalsOverlapping from 'date-fns/areIntervalsOverlapping';
import format from 'date-fns/format';

import tasks from './tasks';
import logo from './logo.svg';
import './App.css';
import React from 'react';

const TIME_FORMAT = 'HH:mm:ss';

const weekdays = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const pad = nmbr => nmbr.toString().padStart(2, '0');

const getEnrichedTask = (task, currentTime) => {
  let lengthMin = task.length * 60;
  const taskDue = parse(task.due, TIME_FORMAT, currentTime);
  const taskStart = subMinutes(taskDue, lengthMin);

  return {
    ...task,
    lengthMin,
    taskDue,
    taskStart,
  };
}

const TimeFromSeconds = ({ timeSeconds, ...props }) => {
  const hours = pad(Math.floor(timeSeconds / 3600));
  const minutes = pad(Math.floor((timeSeconds % 3600) / 60));
  const seconds = pad(timeSeconds % 60);

  return <span>{hours}:{minutes}:{seconds}</span>;
}

function Task({ task, currentTime, ...props }) {
  let timeLeft = task.length * 3600;

  if (isAfter(currentTime, task.taskDue)) {
    timeLeft = 0;
  } else if (isAfter(currentTime, task.taskStart)) {
    timeLeft = differenceInSeconds(task.taskDue, currentTime);
  }

  return (
    <div>
      <h3>{task.name}</h3>
      <p><small>{format(task.taskStart, 'HH:mm')}-{format(task.taskDue, 'HH:mm')}</small></p>
      <p>Aikaa jäljellä: <TimeFromSeconds timeSeconds={timeLeft} /></p>
      <p>Pituus: {task.length}</p>
    </div>
  )
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { currentTime: new Date() };
  }

  componentDidMount() {
    this.interval = setInterval(
      () => this.setState({ currentTime: new Date() }),
      1000,
    );
  }

  render() {
    let { currentTime } = this.state;

    // currentTime = parse('14:35:34', TIME_FORMAT, currentTime);

    const goodNight = isAfter(currentTime, parse('00:00:00', TIME_FORMAT, currentTime))
        && isBefore(currentTime, parse('06:00:00', TIME_FORMAT, currentTime));

    const weekdayN = getDay(currentTime);
    const weekday = weekdays[weekdayN];
    
    let tasksToday = tasks[weekday].map(task => getEnrichedTask(task, currentTime));

    let workTask = tasksToday.find(task => task.name === 'Työt');

    const overlappingTasks = tasksToday.filter((task) => {
      if (task.name === 'Työt') {
        return false;
      }

      return areIntervalsOverlapping(
        { start: workTask.taskStart, end: workTask.taskDue },
        { start: task.taskStart, end: task.taskDue },
      );
    });

    if (overlappingTasks.length > 0) {
      workTask.length = overlappingTasks.reduce(
        (acc, cur) => {
          return acc + cur.length;
        },
        workTask.length,
      );
    }

    workTask = getEnrichedTask(workTask, currentTime);
    tasksToday[0] = workTask;

    let freeTime = 0;

    if (isBefore(currentTime, workTask.taskStart)) {
      freeTime = differenceInSeconds(workTask.taskStart, currentTime);
    }

    return (
      <div className="App">
        <header className="App-header">
          <div>{format(currentTime, TIME_FORMAT)}</div>

          {goodNight && <h1>Hyvää yötä!</h1>}
          {!goodNight && (
            <>
              {tasksToday.map(task => <Task task={task} currentTime={currentTime} />)}

              <div>
                <h3>Vapaa aika:</h3>
                <p>Aikaa jäljellä: <TimeFromSeconds timeSeconds={freeTime} /></p>
              </div>
            </>
          )}
        </header>
      </div>
    );
  }
}

export default App;
