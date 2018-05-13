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
    constructor(props) {
        super(props);

        this.signature = props.signature;
        this.description = props.description;
    }

    render() {
        return (
            <li>
                <section className={`code`}>
                    <a className={`codeLink darkBlue`}>
                        {this.signature}
                    </a>

                    <p>{this.description}</p>
                </section>
            </li>
        );
    }
}

class File extends Component {
    
    render() {
        return (
            <ul>
                {this.props.functions.map((f) => 
            <Function key={f.signature} signature={f.signature} description={f.description} />)}
            </ul>
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
                    <div className={`searchResult directoryChild`} onClick={this.callSelect.bind(this, file, index)}>
                        <div className={`resultType ${file.classType}`}></div>
                        <p>{file.name}</p>
                    </div>
                )} 
            </ul>
        );
    }
}

/*
Can be a directory, file, or a class
*/
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
                return <File functions={this.props.item.contents} />;
                break;
            }
            case 'dir': {
                return <Directory files={this.props.item.contents} select={this.props.select}/>;
                break;
            }
        }

    }
}

class DocumentationViewer extends Component {

    constructor(props) {
        super(props);

        let dir = [
            {
                type: "file",
                classType: "fileType",
                name: "vostok.cpp",
                fullPath: "/vfs/vostok.cpp",

                contents:  [
                        {
                            signature: "void func(int arg)",
                            description: "describing the description"
                        },
                        {
                            signature: "int foo(char bar)",
                            description: "another function"
                        }
                    ]
                
            },
            {
                type: "file",
                classType: "fileType",
                name: "kernel.cpp",
                fullPath: "/kernel.cpp",

                contents: [
                        {
                            signature: "int kernel_main(int arg)",
                            description: "the main entry point"
                        }
                        
                    ]
                
            }, 
            {
                type: "file",
                classType: "fileType",
                name: "ipc.cpp",
                fullPath: "/ipc.cpp",

                contents:  [
                    {
                        signature: "int somethingA(int arg)",
                        description: "textA"
                    },
                    {
                        signature: "int somethingB(int arg)",
                        description: "textB"
                    },
                    {
                        signature: "int somethingC(int arg)",
                        description: "textC"
                    }
                    
                ]
                
            }
        ];

        let dirs = [
            {
                type: "dir",
                classType: "dirType",
                name: "services",
                fullPath: "/services",

                contents: dir 
            },
            {
                type: "file",
                classType: "fileType",
                name: "example.txt",
                fullPath: "/example.txt",

                contents: [
                    {
                        signature: "void something(int arg)",
                        description: "nothing"
                    }
                    
                ]
            }
        ];

        let topLevel = {
            type: "dir",
            classType: "dirType",
            name: "/",
            fullPath: "/",

            contents: dirs 
        };

        this.state = {
            breadcrumbs: [topLevel],
            top: topLevel,
            index: 0
        };

        this.handleListItemClick = function (index, e) {
            this.setState(Object.assign(this.state, {index: index}));
        }

        this.handleBreadcrumClick = index => {
            let crumbs = this.state.breadcrumbs.slice(0, index + 1);

            this.setState({
                breadcrumbs: crumbs,
                top: crumbs[crumbs.length - 1],
                index: 0
            });
        };

        this.renderableSelected = (file, index) => {

            let parent = this.state.top.contents[this.state.index];
            let crumbs = this.state.breadcrumbs;
            crumbs.push(parent);

            this.setState({
                breadcrumbs: crumbs,
                top: parent,
                index: index
            });

        };

        /*this.select = (file) => {
            this.setState(Object.assign(this.state, {
                breadcrumbs: file.fullPath.split("/")})
            );
        };

        this.renderables = items.map((item) => <Renderable item={item} select={this.select} />);
        this.state = {rend: this.renderables[0], index: 0, breadcrumbs: [""]};

        this.handleListItemClick = function (index, e) {

            this.setState({
                rend: this.renderables[index],
                index: index,
                breadcrumbs: this.state.breadcrumbs,
                selectableItems: items
            });
        };

        this.state.selectableItems = items.map((item, index) => 
                <ListItem item={item} />);
        */
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
                                        <div className={`breadcrumb`}>
                                            <a className={`breadcrumbLink`}
                                                onClick={this.handleBreadcrumClick.bind(this, index)}
                                             >{crumb.name}</a>
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