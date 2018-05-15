/*
Copyright (c) 2018, Patrick Lafferty
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the copyright holder nor the names of its 
      contributors may be used to endorse or promote products derived from 
      this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR 
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
import React, {Component} from 'react';
import style from './saturn.css';

class Function extends Component {

    render() {
        return (
            <li>
                <section className={`code`}>
                    <div className={`function`}>
                        <p className={`functionName darkBlue`}>
                            {this.props.name}
                        </p>

                        <div className={`functionParameterList`}>
                            <p>(</p>

                            {this.props.signature.map((s, index) => 
                                s.link ? <a key={index} href={'#' + s.link}>{s.type}{index < this.props.signature.length - 1 ? ',' : ''}</a>
                                    : <p key={index}>{s.type}{index < this.props.signature.length - 1 ? ',' : ''}</p>
                            )}

                            <p>) -> </p>

                            {
                            this.props.return.link ? 
                                <a href={'#' + this.props.return.link}>{this.props.return.type}</a>
                                : <p>{this.props.return.type}</p>
                            }

                        </div>
                    </div>

                    <p>{this.props.description}</p>
                </section>
            </li>
        );
    }
}

class Class extends Component {
    render() {
        return (
            <section className={`class`}>
                <h1 className={`className blueBorderBottom`}>{this.props.data.name}</h1>

                {this.props.data.classComment && 
                    <p>{this.props.data.classComment}</p>
                }

                {this.props.data.publicMethods.length > 0 &&
                <section>
                    <p className={`classMethods`}>Public Methods</p>

                    <ul>
                        {this.props.data.publicMethods.map((f, index) =>
                            <Function key={index} name={f.name} 
                                signature={f.signature} return={f.return}
                                description={f.description} />
                        )}

                    </ul>

                </section>
                }

            </section>
        );
    }
}

class File extends Component {
    
    render() {
        return (
            <section className={`file`}>
                {this.props.classes.length > 0 &&

                <section>
                    <h1 className={`noMargin blueBorderBottom`}>Classes</h1>

                    <ul className={`noPadding`}>
                        {this.props.classes.map(c =>
                            <Class key={c.name} data={c} />
                        )}
                    </ul>

                </section>
                }

                {this.props.functions.length > 0 &&
                <section>
                    <h1 className={`noMargin blueBorderBottom`}>Free Functions</h1>

                    <ul>
                        {this.props.functions.map((f) => 
                        <Function key={f.signature} 
                            name={f.name} 
                            signature={f.signature} return={f.return}
                            description={f.description} />)}
                    </ul>

                </section>
                }
            </section>
        );
    }
}

class Directory extends Component {

    constructor(props) {
        super(props);
        this.callSelect = (file, index) => {
            this.props.select(file, index);
        };
    }

    render() {
        return (
            <ul className={`directoryContents`}>
                {this.props.files.map((file, index) => 
                    <div key={index} className={`searchResult directoryChild`} onClick={this.callSelect.bind(this, file, index)}>
                        <div className={`resultType ${file.classType}`}></div>
                        <p>{file.name}</p>
                    </div>
                )} 
            </ul>
        );
    }
}

class ListItem extends Component {

    render() {
        return (
            <div className={`searchResult`}>
                <span className={`resultType ${this.props.item.classType}`}>
                    {this.props.item.type}</span> 
                    {this.props.item.name}
            </div>
        );
    }

}

class Renderable extends Component {

    render() {

        switch (this.props.item.type) {
            case 'file': {
                return <File classes={this.props.item.contents.classes} 
                    functions={this.props.item.contents.freeFunctions} />;
                break;
            }
            case 'dir': {
                return <Directory files={this.props.item.contents} select={this.props.select}/>;
                break;
            }
        }

    }
}

import topLevel from './db.js';

class DocumentationViewer extends Component {

    constructor(props) {
        super(props);

        window.onpopstate = () => {
            if (window.location.hash.length == 0) return;

            let splits = window.location.hash.split("/");
            let subdirs = splits.slice(1, -1);
            let crumbs = [topLevel];
            let top = crumbs[0];

            subdirs.forEach(s => {
                let index = top.contents.findIndex(d => d.name == s);
                crumbs.push(top.contents[index]);
                top = top.contents[index];
            });

            let filename = splits.pop();
            let fileIndex = top.contents.findIndex(f => f.name == filename);

            this.setState({
                breadcrumbs: crumbs,
                top: top,
                index: fileIndex
            });
        };

        this.state = {
            breadcrumbs: [topLevel],
            top: topLevel,
            index: 0
        };

        this.updateUrl = (breadcrumbs, top, index) => {

            let url = breadcrumbs.map(b => b.name).join("/");
            url += "/" + top.contents[index].name;
            window.location.hash = url;
        };

        this.handleListItemClick = function (index, e) {

            this.updateUrl(this.state.breadcrumbs, this.state.top, index);
        }

        this.handleBreadcrumClick = index => {
            let crumbs = this.state.breadcrumbs.slice(0, index + 1);
            this.updateUrl(crumbs, crumbs[crumbs.length - 1], 0);
        };

        this.renderableSelected = (file, index) => {

            let parent = this.state.top.contents[this.state.index];
            let crumbs = this.state.breadcrumbs;
            crumbs.push(parent);

            this.updateUrl(crumbs, parent, index);
        };
    }

    render() {
        return(
            <div className={style.blueBackground}>
                <main>
                    <div className={`browser`}>
                        <div className={`browserMenu darkBlue`}>
                            <div className={`tabBar`}>

                                <div className={`tab lightBlue`}>Browse</div>
                                <div className={`tab`}>Search</div>

                            </div>
                        </div>

                        <div className={`browserNavigation lightBlue`}>
                            <div className={`navigation`}>

                                {
                                    this.state.breadcrumbs.map((crumb, index) => 
                                        <div key={index} className={`breadcrumb`}>
                                            <a className={`breadcrumbLink`}
                                                onClick={this.handleBreadcrumClick.bind(this, index)}
                                             >{crumb.name ? crumb.name : "/"}</a>
                                        </div>
                                    )
                                }

                            </div>
                        </div>

                        <ul className={`list lightBlue`}>
                            {
                                this.state.top.contents.map((file, index) => 

                                <li className={index == this.state.index ? `darkBlue` : `lightBlue`} 
                                    key={index.toString()} 
                                    onClick={this.handleListItemClick.bind(this, index)}
                                    >
                                    <ListItem item={file}/>
                                </li>
                                
                            ) 
                            }
                        </ul>

                        <div className={`viewer darkBlue`}>
                                <Renderable item={this.state.top
                                    .contents[this.state.index]} 
                                    select={this.renderableSelected}/>
                        </div>

                    </div>
                </main>
            </div>
        );
    }
}

export default DocumentationViewer;