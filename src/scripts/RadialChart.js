import { cluster, hierarchy, linkRadial, zoom } from 'd3'
import { select } from 'd3-selection'
import { wrapText } from '../../utils.js'
import 'd3-transition'

class Tree {
	constructor(props) {
		const params = Object.assign(
			{
				container: document.body,
				width: 500,
				height: 450,
				margin: {
					top: 100,
					right: 100,
					bottom: 100,
					left: 100
				},
				data: null,
				transitionTime: 750,
				circleRadius: 5,
				expandAll: false,
				openedDepth: 3
			},
			props
		)

		this.params = params
		this.container = select(params.container || 'body')
		this.zoom = zoom().on('zoom', e => this.handleZoom(e))

		this.setChartDimensions()
		this.renderContainers()
		this.setupData()
		this.update(this.root)
	}

	setChartDimensions() {
		let { width, height, margin } = this.params

		const w = this.container.node().getBoundingClientRect().width

		if (w) {
			width = w
			this.params.width = w
		}

		const h = this.container.node().getBoundingClientRect().height

		if (h) {
			height = h
			this.params.height = h
		}

		this.chartWidth = width - margin.left - margin.right
		this.chartHeight = height - margin.top - margin.bottom
		this.radius = Math.min(this.chartWidth, this.chartHeight) * 0.5
	}

	handleZoom(e) {
		this.chart.attr('transform', e.transform)
	}

	renderContainers() {
		const { width, height, margin } = this.params

		this.svg = this.container
			.selectAll('svg')
			.data(['svg'])
			.join('svg')
			.attr('width', width)
			.attr('height', height)
			.call(this.zoom)
			.on('zoom.dblclick', null)

		this.chart = this.svg
			.selectAll('g.chart')
			.data(['chart'])
			.join('g')
			.attr('class', 'chart')

		this.chartInner = this.chart
			.selectAll('g.chart-inner')
			.data(['chart-inner'])
			.join('g')
			.attr('class', 'chart-inner')
			.attr(
				'transform',
				`translate(
					${margin.left + this.chartWidth * 0.5}, 
					${margin.top + this.chartHeight * 0.5})`
			)
	}

	setupData() {
		this.diagonal = linkRadial()
			.angle(d => d.x)
			.radius(d => d.y)

		this.root = hierarchy(this.params.data)

		this.tree = cluster()
			.size([2 * Math.PI, this.radius])
			.separation((a, b) => (a.parent == b.parent ? 1.5 : 2) / b.depth)

		this.root.x0 = 0
		this.root.y0 = 0

		this.root.descendants().forEach(d => {
			d._children = d.children

			if (!this.params.expandAll && d.depth > this.params.openedDepth) {
				d.children = null
			}
		})
	}

	update(source) {
		const nodes = this.root.descendants()
		const links = this.root.links()

		// Compute the new tree layout.
		this.tree(this.root)

		this.appendLinks(links, source)
		this.appendNodes(nodes, source)

		// Stash the old positions for transition.
		this.root.eachBefore(d => {
			// d.y = 150 * d.depth
			d.x0 = d.x
			d.y0 = d.y
		})
	}

	appendNodes(nodes, source) {
		// Update the nodes…
		const node = this.chartInner.selectAll('g.node').data(nodes, d => d.data.id)

		const sel = node.join(
			enter => {
				const nodeSel = enter
					.append('g')
					.attr('class', 'node')
					.attr(
						'transform',
						() => `
							rotate(${(source.x0 * 180) / Math.PI - 90})
					    translate(${source.y0}, 0)
						`
					)
					.attr('fill-opacity', 0)
					.attr('stroke-opacity', 0)
					.on('click', (e, d) => {
						if (d.data.key === 'root') {
							return
						}
						if (!d._children && !d.children) {
							return
						}
						d.children = d.children ? null : d._children
						this.update(d)
					})

				nodeSel
					.append('circle')
					.attr('class', 'node-circle')
					.attr('r', this.params.circleRadius)
					.attr('fill', () => {
						return '#fafafa'
					})

				const nodeLabel = nodeSel
					.append('text')
					.attr('class', 'node-label')
					.attr('transform', d => {
						return `rotate(${d.x >= Math.PI ? 180 : 0})`
					})
					.attr('dy', '0.32em')
					.attr('x', d => {
						if (!d.children) {
							return d.x < Math.PI ? 12 : -12
						}
						return 0
					})
					.attr('y', d => {
						if (d.children) {
							return 10
						}
						return 0
					})
					.attr('text-anchor', d => {
						if (!d.children) {
							return d.x < Math.PI ? 'start' : 'end'
						}
						return 'middle'
					})
					.attr('fill', '#ccc')
					.text(d => {
						const len = 20
						let name = d.data.key || ''
						if (name.length > len) {
							name = name.slice(0, len) + '...'
						}
						return name
					})

				nodeLabel.call(wrapText, 100)

				return nodeSel
			},
			update => update,
			exit =>
				exit
					.lower()
					.transition()
					.duration(750)
					.attr(
						'transform',
						() => `
								rotate(${(source.x * 180) / Math.PI - 90})
								translate(${source.y},0)
						`
					)
					.attr('fill-opacity', 0)
					.attr('stroke-opacity', 0)
					.remove()
		)

		sel
			.transition()
			.duration(this.params.transitionTime)
			.attr(
				'transform',
				d => `
					rotate(${(d.x * 180) / Math.PI - 90})
					translate(${d.y},0)
				`
			)
			.attr('fill-opacity', 1)
			.attr('stroke-opacity', 1)
	}

	appendLinks(links, source) {
		// Update the links…
		const link = this.chartInner
			.selectAll('path.link')
			.data(links, d => d.target.data.id)

		const linkSel = link.join(
			enter =>
				enter
					.append('path')
					.attr('class', 'link')
					.attr('fill', 'none')
					.attr('stroke', '#ccc')
					.attr('d', () => {
						const o = { x: source.x0, y: source.y0 }
						return this.diagonal({ source: o, target: o })
					}),
			update => update,
			exit =>
				exit
					.transition()
					.duration(this.params.transitionTime)
					.attr('d', () => {
						const o = { x: source.x, y: source.y }
						return this.diagonal({ source: o, target: o })
					})
					.remove()
		)

		linkSel
			.transition()
			.duration(this.params.transitionTime)
			.attr('d', this.diagonal)
	}
}

export default Tree
