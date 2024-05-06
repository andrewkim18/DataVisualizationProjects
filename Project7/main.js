d3.json("shows.json").then(function (graph) {
    const links = graph.links || [];
    const nodes = graph.nodes;
    const center = { x: 400, y: 400 };
    const radius = 400;

    nodes.forEach(node => {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        node.x = center.x + r * Math.cos(angle);
        node.y = center.y + r * Math.sin(angle);
    });

    function isConnected(a, b) {
        return links.some(function (d) {
            return (d.source === a && d.target === b)
                || (d.source === b && d.target === a);
        });
    }

    function updateDetailInfoCard(d) {
        const detailTitle = document.getElementById("detailTitle");
        const detailInfo = document.getElementById("detailInfo");

        detailTitle.innerText = "";
        detailInfo.innerHTML = "";

        if (d.type === "TV Show") {
            detailTitle.innerText = d.name;
            const showDetails = `Cast: ${d.cast}\n\nGenre: ${d.genre}\n\nDescription: ${d.description}`;
            detailInfo.innerText = showDetails;
        } else if (d.type === "Actor") {
            detailTitle.innerText = d.name;
            detailInfo.innerText = `TV Show(s): ${d.tvshows}`;
        }

        document.getElementById("detailInfoCard").style.display = "block";
    }

    const svg = d3.select("#forceDirectedGraph"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    const color = d3.scaleOrdinal()
        .domain(["TV Show", "Actor"])
        .range(["green", "blue"]);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.name))
        .force("charge", d3.forceManyBody().strength(-14.5))
        .force("center", d3.forceCenter(center.x, center.y))
        .force("collide", d3.forceCollide(5))
        .force("x", d3.forceX(center.x))
        .force("y", d3.forceY(center.y))

    for (let i = 0; i < 100; ++i) {
        simulation.tick();
    }

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    let focusedNode = null;

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => d.type === "TV Show" ? 6 : 4)
        .attr("fill", d => color(d.type))
        .on("mouseover", function (event, d) {
            updateDetailInfoCard(d);
            node.attr('stroke', null).attr('stroke-width', null);
            focusedNode = d;
            d3.select(this).attr('stroke', 'black').attr('stroke-width', 2);
            node.style('opacity', o => isConnected(d, o) || d === o ? 1 : 0.1);
            link.style('opacity', o => o.source === d || o.target === d ? 1 : 0.1);
            svg.selectAll(".node-label").remove();
            svg.append("text")
                .attr("class", "node-label")
                .attr("x", d.x + 10)
                .attr("y", d.y)
                .text(d.name);
        })
        .on("mouseout", function (d) {

        });

    node.append("title").text(d => d.name);

    svg.on("click", function (event) {
        if (!event.defaultPrevented && focusedNode) {
            node.style('opacity', 1);
            link.style('opacity', 1);
            svg.selectAll(".node-label").remove();
            node.attr('stroke', null).attr('stroke-width', null);
            focusedNode = null;
        }
    });

    const names = graph.nodes.map(node => node.name).sort();
    const dataList = d3.select("#showsAndCasts");
    names.forEach(name => {
        dataList.append("option").attr("value", name);
    });

    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);

    document.getElementById("searchField").addEventListener("input", function (e) {
        const searchText = e.target.value.toLowerCase();

        d3.selectAll('.node-label').remove();
        node.attr('stroke', null).attr('stroke-width', null);
        node.style('opacity', 1);
        link.style('opacity', 0.1);

        const matchingNode = nodes.find(n => n.name.toLowerCase() === searchText);
        if (matchingNode) {
            updateDetailInfoCard(matchingNode);

            d3.selectAll(".nodes circle")
                .attr('stroke', d => d === matchingNode ? 'black' : null)
                .attr('stroke-width', d => d === matchingNode ? 2 : null)
                .style('opacity', d => isConnected(matchingNode, d) || matchingNode === d ? 1 : 0.1);

            link.style('opacity', o => o.source === matchingNode || o.target === matchingNode ? 1 : 0.1);

            svg.append("text")
                .attr("class", "node-label")
                .attr("x", matchingNode.x + 10)
                .attr("y", matchingNode.y)
                .text(matchingNode.name);
        } else {
            node.style('opacity', 1);
            link.style('opacity', 1);
        }
    });
});