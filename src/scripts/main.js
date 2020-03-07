import '../styles/main.scss';
import Chart from './charts/Chart';
import data from '../data/data.json';

class App {
  constructor(data) {
    this.chart = new Chart({
      container: '#chart',
      data: data
    });

    this.chart.render();
  }
}

new App(data);