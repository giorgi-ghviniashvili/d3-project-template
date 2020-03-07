import {select, event} from 'd3-selection';
import 'd3-transition';

class Chart {
  constructor (props) {
    var params = Object.assign({
      container: document.body, 
      width: 0, // calculated dynamically if zero 
      height: 450,
      margin: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      },
      data: null,
      transitionTime: 750,
    }, props);

    this.params = params;
    this.container = select(params.container || 'body');

    this.setChartDimenstions();
  }
  
  setChartDimenstions() {
    let { width, height, margin } = this.params;

    if (!width) {
      var w = this.container.node().getBoundingClientRect().width;

      if (w) {
        width = w;
        this.params.width = w;
      }
    }

    this.chartWidth = width - margin.left - margin.right;
    this.chartHeight = height - margin.top - margin.bottom;
  }

  renderContainers () {
    const { width, height, margin } = this.params;

    this.svg = this.container
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    this.chart = this.svg
        .append('g')
        .attr('class', 'chart')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
  }

  draw() {
    if (this.params.data) {
      this.chart.selectAll('circle')
        .data(this.params.data)
        .join(
          enter => enter.append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.y)
            .attr('fill', 'navy'),
          update => update,
          exit => exit
        )
    }
  }

  render() {
    this.renderContainers();
    this.draw();
  }
}

export default Chart;