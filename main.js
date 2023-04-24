import './src/styles/style.css'
import Chart from './src/scripts/Chart'
import { json } from 'd3-fetch'

class App {
	constructor() {
		json('./data/data.json').then(data => {
      console.log(data);
			this.chart = new Chart({
				container: '#chart',
				data: data,
			})
		})
	}
}

new App()
